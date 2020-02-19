const env = require('../../env.js')
const log = require('../../log.js')
const lib = require('../../lib.js')

const uuid = require('uuid')

const {
	Vector3
} = require('three')

const Station = require('./entropic/Station.js')
const Commander = require('./sentient/Commander.js')
const Pilot = require('./sentient/Pilot.js')

const Asteroid = require('../ephemera/entropic/Asteroid.js')
// const Projectile = require('../ephemera/entropic/Projectile.js')
const Ship = require('./entropic/Ship.js')
const Freighter = require('./entropic/ShipFreighter.js')

const Persistent = require('./_Persistent.js')


const SOCKETS = require('../../single/SOCKETS.js')
const USERS = require('../../single/USERS.js')

const {
	Projectile,
	ARMATURES
} = require('../aux/Armatures.js')

const ProjectileMap = require('../aux/ProjectileMap.js')

const initPulse = require('./SystemPulse.js')


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

log( 'call', 'System.js' )





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

		this.projectiles = init.projectiles || {}


		this.internal = {

			pulses: { 

				npc: {
					spawn: false,
					decide_move: false,
					// think: false ----- event based actually
				},

				entropic: {
					spawn: false,
					move: false,
					// status: false
				},

				misc: {
					projectiles: false
				}

			}

		}

	}













	async bring_online(){

		if( !this.initialized ) {

			let p_uuid = uuid()
			const primary = new Station({
				uuid: p_uuid,
				system_key: this.id,
				subtype: 'primary',
				ref: {
					position: new Vector3().copy( lib.tables.position.station.primary )
					// {
					// 	x: lib.tables.position.station[ 'primary' ].x,
					// 	y: lib.tables.position.station[ 'primary' ].y,
					// 	z: lib.tables.position.station[ 'primary' ].z
					// }
				}
			})
			const primary_commander = new Commander({
				uuid: p_uuid,
				system_key: this.id
			})

			let d_uuid = uuid()
			const docking = new Station({
				uuid: d_uuid,
				system_key: this.id,
				subtype: 'docking',
				ref: {
					position: new Vector3().copy( lib.tables.position.station.docking )
					// {
					// 	x: lib.tables.position.station[ 'docking' ].x,
					// 	y: lib.tables.position.station[ 'docking' ].y,
					// 	z: lib.tables.position.station[ 'docking' ].z
					// }
				}
			})
			const docking_commander = new Commander({
				uuid: d_uuid,
				system_key: this.id
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








	handle_action( o_uuid, packet ){

		const system = this

		// packet = { type[to get us here], index, t_uuid }

		let armature = system.entropic[ o_uuid ].equipped[ packet.index ]

		log('system', 'armature action: ', armature, packet )

		// valid

		if( typeof( packet.index ) !== 'number' || packet.index > 4 ){
			log('flag', 'invalid action: ', packet.index )
			return false
		}

		if( !system.entropic[ o_uuid ] )  return false

		// on cooldown

		if( system.entropic[ o_uuid ].cooldowns[ packet.index ] ){
			SOCKETS[ o_uuid ].send( JSON.stringify({type: 'error', msg: 'on cooldown'}))
			return false
		}		

		// and we go

		if( ARMATURES[ armature ].type == 'cannon' ){

			// has target

			if( !system.entropic[ packet.t_uuid ] ){
				SOCKETS[ o_uuid ].send( JSON.stringify({ type: 'error', msg: 'invalid target', time: 1000 }))
				return false
			}

			let dist = system.entropic[ packet.t_uuid ].ref.position.distanceTo( system.entropic[ o_uuid ].ref.position )

			if( dist > ARMATURES[ armature ].range ){
				SOCKETS[ o_uuid ].send( JSON.stringify({ type: 'error', msg: 'out of range - ' + dist, time: 1000 }))
				return false
			} 

			const new_p = new Projectile( ProjectileMap[ armature ] )
			new_p.system_key = system.id
			new_p.owner_uuid = o_uuid
			new_p.target_uuid = packet.t_uuid
			new_p.subtype = armature

			new_p.launch( system.entropic[ o_uuid ], system.projectiles )
			
			// for( const key of Object.keys( ARMATURES[ armature ] )){
			// 	log('flag', key, system.projectiles[ new_uuid ][ key ] )
			// 	log('flag', 'set to: ', ARMATURES[ armature ][ key ] )
			// 	system.projectiles[ new_uuid ][ key ] = ARMATURES[ armature ][ key ]
			// }


		}else if( ARMATURES[ armature ].type == 'laser' ){

			// has target

			if( !system.entropic[ packet.t_uuid ] ){
				SOCKETS[ o_uuid ].send( JSON.stringify({type: 'error', msg: 'invalid target'}))
				return false
			}

		}else if( ARMATURES[ armature ].type == 'harvester'){

			log('flag', 'missing harvester handler')

		}

		system.entropic[ o_uuid ].cooldowns[ packet.index ] = true

		setTimeout(function(){
			system.entropic[ o_uuid ].cooldowns[ packet.index ] = false
		}, ARMATURES[ armature ].cooldown )

		

		// }else{
		// 	log('system', 'blocked cooldown')
		// }



	}













	destroy( uuid ){

		log('flag', 'destroying: ', uuid )

		

	}








	///////////////////////////////////////// GET

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

					r = [ faction ]

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

				if( response === 'object' ){ //{ log('flag', 'unsupported response type: ', response, principal, type, subtype ); return false }

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

		if( r === [] || r === {} ) r = false
		return r

	}



















	///////////////////////////////////////// COMMS

	broadcast( sender_uuid, packet ){

		const string = JSON.stringify( packet )

		log('wss', 'broadcast: ', string )

		// switch( packet.type ){

		// 	case 'chat':
				for( const uuid of Object.keys( this.sentient.pc ) )   this.send_to_socket( uuid, string )
		// 		break;

		// 	default: 
		// 		for( const uuid of Object.keys( this.sentient.pc ) ){
		// 			if( !sender_uuid || sender_uuid != uuid )  this.send_to_socket( uuid, string )
		// 		}
		// 		break;

		// }

	}


	send_to_socket( uuid, string ){

		if( SOCKETS[ uuid ] ){

			// log('flag', 'sending string: ', string )

			SOCKETS[ uuid ].send( string )

		}else{  // why are they in sentient but no socket ...

			log('flag', 'could not find uuid, deleting: ', uuid )

			system.delete_uuid( uuid )

		}

	}



	delete_uuid( uuid ){

		delete SOCKETS[ uuid ]
		delete USERS[ uuid ]
		delete this.sentient.pc[ uuid ]
		delete this.sentient.npc[ uuid ]
		this.dispose_model( uuid )

		log('flag', 'no socket, deleting user', uuid )

	}




	dispose_model( uuid ){

		delete this.entropic[ uuid ]
		log('flag', 'deleting: ', uuid, ' but finish dispose() function..')

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






	















	///////////////////////////////////////// PULSE

	init_pulse(){

		initPulse( this )

	}

	end_pulse(){

		for( const key of Object.keys( this.internal.pulses ) ){

			for( const type of Object.keys( this.internal.pulses[ key ] ) ){
				log('system', 'clearing setInt: ', key, type )
				clearInterval( this.internal.pulses[ key ][ type ] )
				this.internal.pulses[ key ][ type ] = false
			}

		}

	}

	

	

}

  
module.exports = System