const env = require('../../env.js')
const log = require('../../log.js')
const lib = require('../../lib.js')

const uuid = require('uuid')

const {
	Vector3,
	Quaternion
} = require('three')

const Station = require('./entropic/Station.js')
const Commander = require('./sentient/Commander.js')
const Pilot = require('./sentient/Pilot.js')

const Asteroid = require('../ephemera/entropic/Asteroid.js')
const Ship = require('./entropic/Ship.js')
const Freighter = require('./entropic/ShipFreighter.js')

const Persistent = require('./_Persistent.js')

const SOCKETS = require('../../single/SOCKETS.js')
const USERS = require('../../single/USERS.js')


const maps = {
	entropic: {
		asteroid: Asteroid,
		ship: Ship,
		freighter: Freighter
	},
	sentient: {
		commander: Commander,
		pilot: Pilot
	}
}

// const WSS = require('../Server.js')()
log( 'call', 'System.js' )


const system_pulse = { // avoids circular ref

	npc: {
		spawn: false,
		decide_move: false,
		// think: false ----- event based actually
	},

	entropic: {
		spawn: false,
		move: false
	}

}

class System extends Persistent {


	constructor( init ){

		super( init )

		init = init || {}

		this.initialized = init.initialized

		this.table = 'systems'

		this.name = init.name

		// this.uuid = lib.glean_ID( [init._id, init.uuid] )
		// this.uuid = init.uuid

		this.reputation = lib.json_hydrate( init.reputation )
		// typeof( init.reputation ) === 'string' ? JSON.parse( init.reputation ) : {} 
		// this.faction // only access through get_faction()

		this.planet = init.planet
		this.traffic = init.traffic || 5
		this.volatility = init.volatility === 0 ? 0 : 5

		// instantiated
		if( init.sentient ){
			this.sentient = {
				pc: this.validate_uuids( init.sentient.pc ),
				npc: this.validate_uuids( init.sentient.npc )
			}
		}else{
			this.sentient = {
				pc: {},
				npc: {}
			}
		}

		this.entropic = this.validate_uuids( init.entropic )

		this.private = this.private || []

	}













	async bring_online(){

		if( !this.initialized ) {

			let p_uuid = uuid()
			const primary = new Station({
				uuid: p_uuid,
				subtype: 'primary',
				ref: {
					position: new Vector3( lib.tables.position.station[ 'primary' ].x, lib.tables.position.station[ 'primary' ].y, lib.tables.position.station[ 'primary' ].z )
					// {
					// 	x: lib.tables.position.station[ 'primary' ].x,
					// 	y: lib.tables.position.station[ 'primary' ].y,
					// 	z: lib.tables.position.station[ 'primary' ].z
					// }
				}
			})
			const primary_commander = new Commander({
				uuid: p_uuid
			})

			let d_uuid = uuid()
			const docking = new Station({
				subtype: 'docking',
				ref: {
					position: new Vector3( lib.tables.position.station[ 'primary' ].x, lib.tables.position.station[ 'primary' ].y, lib.tables.position.station[ 'primary' ].z )
					// {
					// 	x: lib.tables.position.station[ 'docking' ].x,
					// 	y: lib.tables.position.station[ 'docking' ].y,
					// 	z: lib.tables.position.station[ 'docking' ].z
					// }
				}
			})
			const docking_commander = new Commander({
				uuid: d_uuid
			})
	
			this.register_entity( 'entropic', false, docking )
			this.register_entity( 'entropic', false, primary )

			this.register_entity( 'sentient', 'npc', primary_commander )
			this.register_entity( 'sentient', 'npc', docking_commander )

			this.initialized = true

			// await this.updateOne() // dont need .. either it all saves together later or not

		}else{

			await this.hydrate_sentient()
			await this.hydrate_entropics()			

		}

		this.init_pulse()

		return 'online'

	}


















	register_entity( type, cgroup, obj ){

		let group = this[ type ]
		if( cgroup ) group = this[ type ][ cgroup ]
		if( obj.uuid ){
			for( const key of Object.keys( group )){
				if( group[ key ].uuid === obj.uuid ){
					log('system', 'SKIPPING overlapping add uuid: ', obj.type, obj.uuid )
					return false
				}
			}
		}else{
			obj.uuid = uuid()
		}

		log('system', 'register_entity: ', type, obj.type, obj.uuid )

		group[ obj.uuid ] = obj

	}



	remove_entity( type, cgroup, uuid ){

		let group = this[ type ]
		if( cgroup ) group = this[ type ][ cgroup ]

		if( !group.uuid ){
			log('flag', 'could not find entity to remove: ', uuid)
		}

		delete group[ uuid ]

	}














	async hydrate_sentient(){

		const system = this

		let needs_update = false

		for( const uuid of Object.keys( system.sentient.pc ) ){

			if( uuid && typeof( uuid === 'string' ) && uuid != 'undefined' ){ 

				if( !system.sentient.pc[ uuid ].is_hydrated ){ 

					let type = system.sentient.pc[ uuid ].subtype || system.sentient.pc[ uuid ].type

					if( type && maps.sentient[ type ] ){ 

						const thisClass = maps.sentient[ type ]

						system.sentient.pc[ uuid ] = new thisClass( system.sentient.pc[ uuid ] )

					}else{

						log('system', 'missing hydration class map for subtype: ', system.sentient.pc[ uuid ].subtype )

					}

				}

			}else{

				log('system', 'invalid sentient hydrate id: ' + uuid + ' :', uuid )

			}

		}



		for( const uuid of Object.keys( system.sentient.npc ) ){

			if( uuid && typeof( uuid === 'string' ) && uuid != 'undefined' ){ 

				if( !system.sentient.npc[ uuid ].is_hydrated ){ 

					let type = system.sentient.npc[ uuid ].subtype || system.sentient.npc[ uuid ].type

					if( type && maps.sentient[ type ] ){ 

						const thisClass = maps.sentient[ type ]

						system.sentient.npc[ uuid ] = new thisClass( system.sentient.npc[ uuid ] )

					}else{

						log('system', 'missing hydration class map for subtype: ', system.sentient.npc[ uuid ].subtype )

					}

				}

			}else{

				log('system', 'invalid sentient hydrate id: ' + uuid + ' :', uuid )

			}

		}

		if( needs_update ) await system.updateOne()

		return

	}









	async hydrate_entropics(){

		const system = this

		let needs_update = false

		for( const uuid of Object.keys( system.entropic ) ){

			if( uuid && typeof( uuid ) === 'string' && uuid != 'undefined' ){

				if( !system.entropic[ uuid ].is_hydrated ){ 

					let type = system.entropic[ uuid ].subtype || system.entropic[ uuid ].type

					if( type && maps.entropic[ type ] ){ 

						const thisClass = maps.entropic[ type ]

						system.entropic[ uuid ] = new thisClass( system.entropic[ uuid ] )

					}else{

						log('system', 'missing hydration class map for subtype: ', system.entropic[ uuid ].subtype )

					}

				}

			}else{

				log('system', 'invaluuid entropic hydrate uuid: ' + uuid + ' :', uuid )

			}

		}

		if( needs_update ) await system.updateOne()

		return

	}





	validate_uuids( obj ){

		if( obj ){

			for( const uuid of Object.keys( obj ) ){

				if( !lib.is_uuid( uuid ) ){
					log('flag', 'invalid id: ' + uuid ) 
					delete obj[ uuid ]
				}

			}

		}

		return obj || {}

	}

















	get_faction(){

		const system = this

		let high = 0
		let faction = 'none'

		for( const f of Object.keys( system.reputation ) ){

			if( system.reputation[ f ] > high ){

				faction = f

			}

		}

		return faction

	}




	get_by_subtype( type, subtype, amount ){ 

		const r = []

		for( const uuid of Object.keys( this[ type ] )){

			if( this[ type ][ uuid ].subtype == subtype )  r.push( this[ type ][ uuid ] )

			if( r.length >= amount ) return r

		}

		if( r.length ){
			return r
		}else{
			return false
		}

	}



	get_sentients(){

		let s = {}

		for( const key of Object.keys( this.sentient.pc )){
			s[ key ] = this.sentient.pc[ key ]
		}
		for( const key of Object.keys( this.sentient.npc )){
			s[ key ] = this.sentient.npc[ key ]
		}

		return s

	}



	get_pc( type ){

		const r = []

		if( type == 'entropic' ){
			for( const key of Object.keys( this.entropic ))  if( this.entropic[ key ].pc ) r.push( this.entropic[ key ])
		}else if( type == 'sentient' ){
			for( const key of Object.keys( this.sentient.pc ))  r.push( this.sentient.pc[ key ])
		}

		return r

	}














	get_enemy_target( uuid ){

		const system = this

		let relationships = this.sentient.npc[ uuid ].relationships

		// find nemesis

		let enemy_target = {
			uuid: false,
			score: 0
		}

		let max_dist = 0

		for( const other_uuid of Object.keys( relationships )){
			if( relationships[ other_uuid ].score < -100 && relationships[ other_uuid ].score < enemy_target.score ){ 
				relationships[ other_uuid ].dist = lib.THREE.distanceTo( system.entropic[ uuid ].ref.position, system.entropic[ other_uuid ].ref.position )
				log('flag', relationships[ other_uuid ].dist + ' units away from supposed enemy')
				if( relationships[ other_uuid ].dist > max_dist )  max_dist = relationships[ other_uuid ].dist
				// if( system.entropics[ uuid ] )  enemy_target.uuid = uuid
			}
		}

		if( max_dist > 0 ){ // otherwise, no enemies were found to begin with ^^

			let low_score = 0
			for( const other_uuid of Object.keys( relationships )){
				let distance_adjusted = relationships[ other_uuid ].score * ( relationships[ other_uuid ].dist / max_dist )
				if( distance_adjusted < low_score ){
					enemy_target.uuid = other_uuid
				}
			}

			if( enemy_target.uuid < env.MAX_PURSUIT ) return enemy_target.uuid

		}

		return false

	}














	broadcast( sender_uuid, packet ){

		const string = JSON.stringify( packet )

		log('wss', 'broadcast: ', string )

		switch( packet.type ){

			case 'chat':
				for( const uuid of Object.keys( this.sentient.pc ) )   this.send_to_socket( uuid, string )
				break;

			default: 
				for( const uuid of Object.keys( this.sentient.pc ) ){
					if( !sender_uuid || sender_uuid != uuid )  this.send_to_socket( uuid, string )
				}
				break;

		}

	}


	send_to_socket( uuid, string ){

		if( SOCKETS[ uuid ] ){

			SOCKETS[ uuid ].send( string )

		}else{  // why are they in sentient but no socket ...

			delete SOCKETS[ uuid ]
			delete USERS[ uuid ]
			delete this.sentient.pc[ uuid ]
			this.dispose( uuid )

			log('flag', 'no socket, deleting user', uuid )

		}

	}





	dispose( uuid ){

		delete this.entropic[ uuid ]
		log('flag', 'deleting: ', uuid, ' but finish dispose() function..')

	}





	

	init_pulse(){

		// npc: { spawn }
		// entropic: { spawn, move }

		const system = this

		/////////////////////////////////////////////////////////////////////////////////////////////// npc spawn

		system_pulse.npc.spawn = setInterval(function(){

			// get defense
			// ( traffic - defense ) = remaining
			// fill defense
			// fill remaining
			// fill hostilities

			let defense = {
				current: 0,
				capacity: 0
			}

			let traffic = {
				current: 0,
				capacity: system.traffic
			}

			let enemies = {
				current: 0,
				capacity: system.volatility
			}

			const faction = system.get_faction()

			const sentients = system.get_sentients()

			const primary = system.get_by_subtype( 'entropic', 'primary', 1 )[0]

			for( const uuid of Object.keys( system.entropic ) ){

				// tally desired defenders / traffic

				if( system.entropic[ uuid ].type == 'station' ){

					if( system.entropic[ uuid ].subtype == 'primary' || system.entropic[ uuid ].type == 'station' ){

						defense.capacity += system.entropic[ uuid ].hangar

					}

				}else if( system.entropic[ uuid ].type == 'ship' ){

					if( sentients[ uuid ] ){

						if( !faction || faction == 'neutral' ){

							traffic.current++

						}else{

							if( sentients[ uuid ].reputation[ faction ] > 100 ){

								defense.current++

							}else if( sentients[ uuid ].reputation[ faction ] < -100 ){

								enemies.current++

							}else{ // includes null rep

								traffic.current++

							}

						}

					}

				}

			}

			let need_defense = defense.capacity - defense.current
			let need_traffic = traffic.capacity - traffic.current
			let need_enemies = enemies.capacity - enemies.current

			// defense

			for( let i = 0; i < need_defense; i++ ){
				let new_uuid = uuid()
				let ship = new Ship({
					uuid: new_uuid,
					ref: {
						position: new Vector3( Math.random() * 100, Math.random() * 100, Math.random() * 100 )
						// {
							// x: Math.random() * 100,
							// y: Math.random() * 100,
							// z: Math.random() * 100
						// }
					}
				})
				let pilot = new Pilot({
					uuid: new_uuid,
					reputation: {
						[ faction ]: 150
					},
					waypoint: new Vector3( Math.random() * 500, Math.random() * 500, Math.random() * 500 )

				})

				system.register_entity('entropic', false, ship )
				system.register_entity('sentient', 'npc', pilot )
			}

			// misc

			for( let i = 0; i < need_traffic; i++ ){
				let new_uuid = uuid()
				let ship = new Freighter({
					uuid: new_uuid,
					ref: {
						position: new Vector3( Math.random() * 100, Math.random() * 100, Math.random() * 100 )
						// {
						// 	x: Math.random() * 100,
						// 	y: Math.random() * 100,
						// 	z: Math.random() * 100
						// }
					}
				})
					
				let pilot = new Pilot({
					uuid: new_uuid,
					reputation: {
						[ faction ]: 0
					},
					waypoint: new Vector3( Math.random() * 500, Math.random() * 500, Math.random() * 500 )
				})
				system.register_entity('entropic', false, ship )
				system.register_entity('sentient', 'npc', pilot )

			}

			// enemies

			for( let i = 0; i < need_enemies; i++ ){
				let new_uuid = uuid()
				let ship = new Ship({
					uuid: new_uuid,
					model_url: 'ships/fighter/spacefighter/spacefighter01.glb',
					ref: {
						position: new Vector3( Math.random() * 100, Math.random() * 100, Math.random() * 100 )
						// {
						// 	x: Math.random() * 100,
						// 	y: Math.random() * 100,
						// 	z: Math.random() * 100
						// }
					}
				})
				let pilot = new Pilot({
					uuid: new_uuid,
					reputation: {
						[ faction ]: -150
					},
					waypoint: new Vector3( Math.random() * -500, Math.random() * -500, Math.random() * -500 )
				})

				if( i === 0 ) ship.log = true
				
				system.register_entity('entropic', false, ship )
				system.register_entity('sentient', 'npc', pilot )
			}

		}, lib.tables.pulse.npc.spawn )

		/////////////////////////////////////////////////////////////////////////////////////////////// npc think

		// ----- thinking should be event based, not timer

		system_pulse.npc.decide_move = setInterval(function(){

			// let drifted = 0

			// set ref.position, ref.momentum, ref.quaternion - these are DESIRED locations that will be lerped to client side
			for( const uuid of Object.keys( system.sentient.npc )){

				if( system.entropic[ uuid ]){

					const move = system.sentient.npc[ uuid ].decide_move()

					switch( move.type ){

						case 'engage':

							log('flag', 'sentient engage: ', move.e_uuid )

							if( system.entropic[ uuid ].move_towards ){ // ships only
								system.entropic[ uuid ].move_towards( system.entropic[ move.e_uuid ].ref.position )
							}else{
								log('flag', 'non ship being asked to engage')
							}
							break;

						case 'waypoint':

							if( system.entropic[ uuid ].move_towards ){

								const runway = system.entropic[ uuid ].move_towards( move.waypoint )

								if( runway == 'arrived' ){
									log('npc_move', uuid.substr(0, 3), 'arrived')
									delete system.sentient.npc[ uuid ].waypoint
								}

							}else{

								log('flag', 'non ship being asked to move')

							}
							break;

						case 'drift':
							// alright then
							// the rrrrreal physics
							// drifted = system.entropic[ uuid ].ref.momentum * lib.tables.pulse.npc.decide_move
							system.entropic[ uuid ].ref.position.add( system.entropic[ uuid ].ref.momentum )

							break;
						default:
						break;
					}

				}
			}


			log('pulse', 'pulse npc think')

		}, lib.tables.pulse.npc.decide_move )

		/////////////////////////////////////////////////////////////////////////////////////////////// entropic spawn

		system_pulse.entropic.spawn = setInterval(function(){

			// minerals, resources, etc

			log('pulse', 'pulse entropic spawn')

		}, lib.tables.pulse.entropic.spawn )

		/////////////////////////////////////////////////////////////////////////////////////////////// entropic broadcast move

		system_pulse.entropic.move = setInterval(function(){

			const packet = {
				type: 'move',
				entropic: {}
			}

			for( const uuid of Object.keys( system.entropic ) ){

				if( !system.entropic[ uuid ].ref.model ) log('flag', 'missing: ', system.entropic[ uuid ] )

				// add pos to packet
				packet.entropic[ uuid ] = {
					mom: system.entropic[ uuid ].ref.momentum || new Vector3(), ///{ x: 0, y: 0, z: 0 },
					pos: system.entropic[ uuid ].ref.position || new Vector3(), //{ x: 0, y: 0, z: 0 },
					// quat: system.entropic[ uuid ].ref.quaternion || new Quaternion(), //{ x: 0, y: 0, z: 0, w: 0 },
					quat: system.entropic[ uuid ].ref.model.quaternion || new Quaternion(), //{ x: 0, y: 0, z: 0, w: 0 },
					boost: system.entropic[ uuid ].ref.boosting,
					pc: system.sentient.pc[ uuid ] ? true : false
				}

			}

			system.broadcast( false, packet )

			log('pulse', 'pulse entropic move')

		}, lib.tables.pulse.entropic.move )

		/////////////////////////////////////////////////////////////////////////////////////////////// end

		log('pulse', 'init_pulse: ', system.id )

	}



	end_pulse(){

		for( const key of Object.keys( system_pulse ) ){
			for( const type of Object.keys( system_pulse[ key ] ) ){
				log('system', 'clearing setInt: ', key, type )
				clearInterval( system_pulse[ key ][ type ] )
				system_pulse[ key ][ type ] = false
			}
		}

	}

	










	

	

	

}

  
module.exports = System