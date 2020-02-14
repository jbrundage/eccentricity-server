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













	get( response, principal, type, subtype ){

		let r

		if( response === 'array' ){
			r = []
		}else if( response === 'object' ){
			r = {}
		}else{
			log('flag', 'unspecified response type: ', principal, type, subtype ); return false
		}

		const system = this

		switch( principal ){

			case 'faction': 

				if( response !== 'array' ) { log('flag', 'unsupported response type: ', response, principal, type, subtype ); return false }

				if( type ){

				}else{

					let high = 0
					let faction = 'none'

					for( const f of Object.keys( system.reputation ) ){

						if( system.reputation[ f ] > high )  faction = f

					}

					r.push( faction )

				}

				break;

			case 'sentient':

				if( response !== 'object' ) { log('flag', 'unsupported response type: ', response, principal, type, subtype ); return false }

				if( type == 'pc' ){

					for( const key of Object.keys( system.sentient.pc )){
						r[ key ] = system.sentient.pc[ key ]
					}

				}else if( type == 'npc' ){

					for( const key of Object.keys( system.sentient.npc )){
						r[ key ] = system.sentient.npc[ key ]
					}

				}else{

					for( const key of Object.keys( system.sentient.pc )){
						r[ key ] = system.sentient.pc[ key ]
					}
					for( const key of Object.keys( system.sentient.npc )){
						r[ key ] = system.sentient.npc[ key ]
					}

				}

				break;

			case 'entropic':

				if( response === 'array' ){ //{ log('flag', 'unsupported response type: ', response, principal, type, subtype ); return false }

					if( type ){

						if( subtype ){

							for( const key of Object.keys( system.entropic )){
								if( system.entropic[ key ].subtype == subtype ) r[ key ] = system.entropic[ key ]
								// r.push( system.entropic[ type ][ subtype ][ key ]  )
							}

						}else{

							for( const key of Object.keys( system.entropic )){
								if( system.entropic[ key ].type == type )  r[ key ] = system.entropic[ key ]
							}

						}

					}else{

						for( const key of Object.keys( system.entropic ))  r[ key ] = system.entropic[ key ]

					}

				}else if( response === 'array' ){

					if( type ){

						if( subtype ){

							for( const key of Object.keys( system.entropic )){
								if( system.entropic[ key ].subtype == subtype ) r.push( system.entropic[ key ] )
								// r.push( system.entropic[ type ][ subtype ][ key ]  )
							}

						}else{

							for( const key of Object.keys( system.entropic )){
								if( system.entropic[ key ].type == type )  r.push( system.entropic[ key ] )
							}

						}

					}else{

						for( const key of Object.keys( system.entropic ))  r.push( system.entropic[ key ] )

					}

				}

				break;

			case 'pc':

				if( response !== 'array' ) { log('flag', 'unsupported response type: ', response, principal, type, subtype ); return false }

				if( type == 'entropic' ){

					for( const key of Object.keys( this.entropic )) {
						if( this.entropic[ key ].pc ) r.push( this.entropic[ key ])
					}

				}else if( type == 'sentient' ){

					for( const key of Object.keys( this.sentient )) {
						r.push( this.sentient[ key ])
					}

				}

				break;

			default: 

				break;

		}

		return r

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

			const faction = system.get('array', 'faction')[0]

			const sentients = system.get('object', 'sentient')

			const primary = system.get('array', 'entropic', true, 'primary')[0]

			for( const uuid of Object.keys( system.entropic ) ){

				// tally desired defenders / traffic

				if( system.entropic[ uuid ].type == 'station' ){

					if( system.entropic[ uuid ].subtype == 'primary' || system.entropic[ uuid ].type == 'station' ){

						defense.capacity += system.entropic[ uuid ].hangar

					}

				}else if( system.entropic[ uuid ].type == 'ship' ){

					// if( sentients.findIndex( (s) => s.uuid === uuid ) ){
					if( sentients[ uuid ]){

						if( !faction || faction == 'none' ){

							traffic.current++

						}else{

							if( sentients[ uuid ].reputation[ faction ] > lib.tables.factions.friend ){

								defense.current++

							}else if( sentients[ uuid ].reputation[ faction ] < lib.tables.factions.enemy ){

								enemies.current++

							}else{ // includes null rep

								traffic.current++

							}

						}

					}else{
						log('flag', '(no sentient)')
					}

				}

			}

			let need_defense = defense.capacity - defense.current
			let need_traffic = traffic.capacity - traffic.current
			let need_enemies = enemies.capacity - enemies.current

			log('system', 'npc.spawn: need defense, traffic, enemies: ', need_defense, need_traffic, need_enemies )

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

				if( system.entropic[ uuid ] && system.entropic[ uuid ].type == 'ship' ){

					const move = system.sentient.npc[ uuid ].decide_move( system )

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

								if( !system.sentient.npc[ uuid ].waypoint ) system.sentient.npc[ uuid ].waypoint = move.waypoint

								const runway = system.entropic[ uuid ].move_towards( move.waypoint )

								if( runway == 'arrived' ){
									log('npc_move', uuid.substr(0, 3), 'arrived')
									system.entropic[ uuid ].ref.momentum = new Vector3(0, 0, 0)
									system.entropic[ uuid ].ref.boosting = false
									delete system.sentient.npc[ uuid ].waypoint
								}

							}else{

								log('flag', 'non ship being asked to move: ', system.entropic[ uuid ].type, system.entropic[ uuid ].subtype )

							}
							break;

						case 'drift':
							// alright then
							// the rrrrreal physics
							// drifted = system.entropic[ uuid ].ref.momentum * lib.tables.pulse.npc.decide_move
							system.entropic[ uuid ].ref.position.add( system.entropic[ uuid ].ref.momentum )

							break;

						case 'station':

							// log('system', 'skipping station')

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
					waypoint: system.sentient.npc[ uuid ] ? system.sentient.npc[ uuid ].waypoint : false,
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