const env = require('../env.js')
const log = require('../log.js')
const lib = require('../lib.js')

const uuid = require('uuid')

const DB = require('../db.js')

const { 
	Vector3,
	Quaternion
} = require('three')

const aux_package = require('../class/aux/package.js')

const System = require('../class/persistent/System.js')
const User = require('../class/persistent/User.js')
const Pilot = require('../class/persistent/sentient/Pilot.js')

const SOCKETS = require('./SOCKETS.js')
const SYSTEMS = require('./SYSTEMS.js')
const USERS = require('./USERS.js')

log( 'call', 'Galaxy.js' )


let galaxy = false




function getSingleton( init ){

	if( galaxy ) return galaxy

	galaxy = new Galaxy( init )

	return galaxy

}


class Galaxy {

	constructor( init ){

		init = init || {}

		this.pulse = init.pulse

	}






	async init_connection( socket ){
		// check session
		// check users / availability
		// touch system
		// add player objects to system
		// send init to player
		// send init to system players

		const pool = DB.getPool()

		if( Object.keys( USERS ).length >= env.MAX_PILOTS ) {
			let msg = 'error connecting: air traffic control has put a hold on more pilots, try back later'
			log('flag', msg)
			return msg
		}		


		// check database for existing PILOT / SHIP:
		socket.request.session.user = new User( socket.request.session.user )
		// saved system_key's should be returned here:
		// do NOT assign to user - returns publish() value
		await socket.request.session.user.touch_pilot()


		// if( !socket.request.session.user.PILOT.is_hydrated ){
		// 	socket.request.session.user.PILOT = new Pilot( socket.request.session.user.PILOT )
		// }

		const station_key = socket.request.session.user.PILOT.station_key
		const system_key = socket.request.session.user.PILOT.system_key

		socket.request.session.user.PILOT.SHIP = await socket.request.session.user.PILOT.touch_ship( system_key, false )


		// we have  at least one valid key
		if( typeof( station_key ) !== 'number' || station_key <= 0 || typeof( system_key ) != 'number' || system_key <= 0 ) {
			let msg = 'error connecting: invalid init keys'
			log( 'flag', msg, station_key, system_key )
			return msg
		}

		const SYSTEM = await this.touch_system( system_key )

		if( !SYSTEM ){
			log( 'galaxy', 'failed to init system' )
			socket.disconnect()
			return false
		}


		socket.uuid = uuid()
		
		SOCKETS[ socket.uuid ] = socket									// boom
		SOCKETS[ socket.uuid ].uuid = socket.uuid

		USERS[ socket.uuid ] = socket.request.session.user 				// boom 
		USERS[ socket.uuid ].uuid = socket.uuid

		USERS[ socket.uuid ].PILOT.uuid = socket.uuid
		USERS[ socket.uuid ].PILOT.SHIP.uuid = socket.uuid
		USERS[ socket.uuid ].PILOT.SHIP.pc = true

		USERS[ socket.uuid ].PILOT.SHIP.log = false


		// USERS[ socket.uuid ].PILOT.SHIP		

		SYSTEM.register_entity( 'entropic', false, USERS[ socket.uuid ].PILOT.SHIP ) 	// boom
		SYSTEM.register_entity( 'sentient', 'pc', USERS[ socket.uuid ].PILOT ) 		// boom 

		this.bind_player( SYSTEM, socket.uuid )

		SOCKETS[ socket.uuid ].send( JSON.stringify( {
			type: 'init_session',
			system: SYSTEM.publish(),
			user: USERS[ socket.uuid ],
			uuid: socket.uuid,
			packages: aux_package()
		}) )

		SYSTEM.broadcast( socket.uuid, { 
			type: 'init_pilot',
			pilot: USERS[ socket.uuid ].PILOT  //.core()
		})

	}










	async touch_system( id ){

		// validate

		if( typeof( id ) !== 'number' || id <= 0 ) {
			log('flag', 'invalid system id type: ', id )
			return false
		}

		if( SYSTEMS[ id ] ) { 

			// SYSTEMS[ id ] = new System( SYSTEMS[ id ] ) // every player arrival could be way overkill

			if( !this.pulse ) this.bigbang()  // should never be the case

			return SYSTEMS[ id ]

		}

		// end validate

		const pool = DB.getPool()

		// const res = await new Promise( ( resolve, reject ) => {
		const sql = 'SELECT * FROM \`systems\` WHERE id = ? LIMIT 1'

		const { results, fields } = await pool.queryPromise( sql, [ id ] )//, ( err, res, fields ) => {
			
		if( !results ) {
			log('galaxy', 'failed to find system for: ', id )
			return false
		}

		if( !this.pulse ) this.bigbang()

		SYSTEMS[ id ] = new System( results[0] )

		// SYSTEMS[ id ].tick( 'on' )

		// log('galaxy', 'SYSTEM post hydrate: ', SYSTEMS[ id ] )

		await SYSTEMS[ id ].bring_online() // HERE all should have eid's

		return SYSTEMS[ id ]

	}








	bind_player( system, uuid ){

		const galaxy = this

		let packet = {}

		const USER  = USERS[ uuid ]

		SOCKETS[ uuid ].on('message', function( data ){

			try{ 
				packet = lib.sanitize_packet( JSON.parse( data ) )
			}catch(e){
				USER.internal.bad_packets++
				if( USER.internal.bad_packets > 100 ){
					log('flag', 'packet problem for USER:', USER.uuid, e )
				}
			}

			switch( packet.type ){

				case 'move':

					log('wss', 'rcvd packet: ', packet )

					USER.PILOT.SHIP.ref.position = new Vector3( packet.pos.x, packet.pos.y, packet.pos.z ) // || USER.PILOT.SHIP.ref.position
					// USER.PILOT.SHIP.ref.model.quaternion.copy( new Quaternion( packet.quat.x, packet.quat.y, packet.quat.z, packet.quat.w ) )//|| USER.PILOT.SHIP.ref.model.quaternion
					USER.PILOT.SHIP.ref.model.quaternion.set( packet.quat._x, packet.quat._y, packet.quat._z, packet.quat._w ) //|| USER.PILOT.SHIP.ref.model.quaternion
					// USER.PILOT.SHIP.ref.quaternion = new Quaternion( packet.quat.x, packet.quat.y, packet.quat.z ) || USER.PILOT.SHIP.ref.quaternion 
					USER.PILOT.SHIP.ref.momentum = new Vector3( packet.mom.x, packet.mom.y, packet.mom.z ) // || USER.PILOT.SHIP.ref.momentum

					USER.internal.last_ping = Date.now()

					break;

				case 'chat':

					switch( packet.method ){
						
						case 'say':

							const chat = lib.sanitize_chat( packet.chat )

							log('flag', 'chat: ', chat )

							if( chat ){
								system.broadcast( uuid, {
									type: 'chat',
									uuid: uuid,
									// speaker: 'blorb',
									speaker: USERS[ uuid ].PILOT.fname,
									method: packet.method,
									color: USERS[ uuid ].PILOT.color,
									chat: chat,
								})
							}else{
								log('flag', 'invalid chat received ', packet.chat )
							}
							break;

						default: break;

					}

					break;

				case 'ping_entropic':

					log('wss', 'client is requesting: ', packet.uuid )

					SOCKETS[ uuid ].send(JSON.stringify({
						type: 'pong_entropic',
						sentient: system.sentient.pc[ packet.uuid ] || system.sentient.npc[ packet.uuid ],
						entropic: system.entropic[ packet.uuid ]
					}))
					break;

				case 'action_bar':
					system.handle_action( uuid, packet )
					break

				// case 'combat':
				// 	system.handle_combat( uuid, packet )
				// 	break;

				// case 'action':
				// 	console.log(packet)
				// 	break;

				// case 'data':
				// 	console.log(packet)
				// 	break;

				default: break;

			}

		})

		SOCKETS[ uuid ].on('close', function( data ){

			system.purge_socket( uuid, data )

		})

	}





	// async create_system( init ){

	// 	const pool = DB.getPool()

	// 	const system = new System()

	// 	pool.query('INSERT INTO \`systems\` ( name, reputation, traffic ) VALUES ( ? , ? , ? )', [ system.name, system.reputation, system.traffic ], (err, res, fields) => {
	// 		if( err || !res ) {
	// 			log('galaxy', 'error sys init: ', err)
	// 			return false
	// 		}

	// 		return system

	// 	})

	// }









	close_system( id ){

		log('system', 'close_system: ', id )

		SYSTEMS[ id ].entropic = {}
		SYSTEMS[ id ].sentient.npc = {}
		SYSTEMS[ id ].sentient.pc = {}

		SYSTEMS[ id ].end_pulse()

		SYSTEMS[ id ].save()
		.then( res => {
			if( res.success ){
				log('system', 'saved system: ', id )
			}else{
				log('flag', 'failed to save system: ', res )
			}
		}).catch( err => { log('flag', 'failed to save system: ', err ) })

		// any setIntervals in System from here are irretrievable !

		delete SYSTEMS[ id ] // seems to work...

	}


	





	bigbang(){

		const galaxy = this

		galaxy.pulse = setInterval(function(){

			for(const id of Object.keys( SYSTEMS )){
				if( !Object.keys( SYSTEMS[ id ].sentient.pc ).length ){
					log('galaxy', 'closing empty system: ', id )
					galaxy.close_system( id )
				}
			}

		}, lib.tables.bingbang_interval )



		log('galaxy', 'bigbang')

	}



}


module.exports = {

	getSingleton

}
