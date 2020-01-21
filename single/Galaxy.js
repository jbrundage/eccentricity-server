const env = require('../env.js')
const log = require('../log.js')
const lib = require('../lib.js')

const uuid = require('uuid')

const DB = require('../db.js')

const System = require('../class/persistent/System.js')
const User = require('../class/persistent/User.js')

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

		this.sockets = init.sockets || {}
		this.users = init.users || {}
		this.systems = init.systems || {}

	}






	async init_connection( socket ){
		// check session
		// check users / availability
		// touch system
		// add player objects to system
		// send init to player
		// send init to system players


		// validation
		// let player = ''
		// if( !socket.request.session.user )// player = 'user not found for socket session'
		// if( !socket.request.session.user.PILOT ) player = 'pilot not found for user'
		
		// if( player !== '' ){
		// if( !socket.request.session.user ){
		// 	socket.send( JSON.stringify({
		// 		type: 'error',
		// 		msg: 'user session not found<br>try reloading once'
		// 	}))
		// 	return false
		// }

		socket.request.session.user = new User( socket.request.session.user )

		socket.request.session.user.PILOT = await socket.request.session.user.touch_pilot()

		socket.request.session.user.PILOT.SHIP = await socket.request.session.user.PILOT.touch_ship()


		let msg = ''
		if( Object.keys( this.users ).length > env.MAX_PILOTS ) msg = 'max users reached' 
	
		const station_key = socket.request.session.user.PILOT.station_key

		if( typeof( station_key ) !== 'number' || station_key <= 0 ) msg = 'invalid station key'

		if( msg != '' ){
			socket.disconnect()
			log('galaxy', 'invalid init_player: ', msg)
			return false
		}
		//end validation






		const SYSTEM = await this.touch_system( station_key )

		if( !SYSTEM ){
			log( 'galaxy', 'failed to init system' )
			return false
		}


		socket.uuid = uuid()
		// all 4 plalyer objects linked by uuid
		this.users[ socket.uuid ] = socket.request.session.user 				// boom 
		this.users[ socket.uuid ].uuid = socket.uuid
		this.sockets[ socket.uuid ] = socket 									// boom
		SYSTEM.add_entity( 'entropic', this.users[ socket.uuid ].PILOT.SHIP ) 	// boom
		SYSTEM.add_entity( 'sentient', this.users[ socket.uuid ].PILOT ) 		// boom 
		

		this.bind_player( SYSTEM, socket.uuid )

		this.sockets[ socket.uuid ].send( JSON.stringify( {
			type: 'init_session',
			system: SYSTEM,
			user: this.users[ socket.uuid ],
			uuid: socket.uuid
		}) )

		this.emit('broadcast', SYSTEM.uuid, socket.uuid, JSON.stringify( { 
			type: 'init_pilot',
			pilot: this.users[ socket.uuid ].PILOT  //.core()
		} ) )

		log('flag', 'at this point:', SYSTEM.entropic )

	}










	async touch_system( id ){

		// validate

		if( typeof( id ) !== 'number' || id <= 0 ) {
			log('flag', 'invalid system id type: ', id )
			return false
		}

		if( this.systems[ id ] ) { 

			// this.systems[ id ] = new System( this.systems[ id ] ) // every player arrival could be way overkill

			if( !this.pulse ) this.awaken()

			return this.systems[ id ]

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

		this.systems[ id ] = new System( results[0] )

		await this.systems[ id ].hydrate() // HERE all should have eid's

		// log('galaxy', 'SYSTEM post hydrate: ', this.systems[ id ] )

		if( !this.pulse ) this.awaken()

		return this.systems[ id ]

	}








	bind_player( system, uuid ){

		const galaxy = this

		let packet = {}

		const USER  = galaxy.users[ uuid ]

		galaxy.sockets[ uuid ].on('message', function( data ){

			try{ 
				packet = lib.sanitize_packet( JSON.parse( data ) )
			}catch(e){
				USER.bad_packets++
				if( USER.bad_packets > 100 ){
					log('flag', 'packet problem for USER:', USER.uuid, e )
				}
			}

			switch( packet.type ){

				case 'move':

					USER.PILOT.SHIP.ref.position = packet.pos || USER.PILOT.SHIP.ref.position
					USER.PILOT.SHIP.ref.quaternion = packet.quat || USER.PILOT.SHIP.ref.quaternion 
					USER.PILOT.SHIP.ref.momentum = packet.mom || USER.PILOT.SHIP.ref.momentum
					break;

				case 'chat':

					switch( packet.method ){
						case 'say':
							const chat = lib.sanitize_chat( packet.chat )
							if( chat ){
								system.emit('broadcast', system.uuid, uuid, JSON.stringify({
									type: 'chat',
									uuid: uuid,
									speaker: 'blorb',
									// speaker: GALAXY.users[ uuid ].PILOT.fname,
									method: packet.method,
									chat: chat,
								}) )
							}else{
								console.log(' invalid chat received ')
							}
							break;

						default: break;

					}

					break;
				case 'combat':
					console.log(packet)
					break;
				case 'action':
					console.log(packet)
					break;
				case 'data':
					console.log(packet)
					break;

				default: break;

			}

		})

		galaxy.sockets[ uuid ].on('close', function( data ){

			const socket = this
			const uuid = socket.uuid

			delete galaxy.users[ uuid ]
			delete galaxy.sockets[ uuid ] // (THIS) ...
			delete system.entropic[ uuid ]
			delete system.sentient[ uuid ]

			// for( const id of Object.keys( system.sentient )){ // ya goof
			for( const uuid of Object.keys( galaxy.sockets )){ 

				if( socket.uuid != uuid ){

					galaxy.sockets[ uuid ].send( JSON.stringify({

						type: 'close_pilot',
						uuid: uuid

					}) )

				}
			}

			if( Object.keys( system.get_pilots() ).length <= 0 ) galaxy.close_system( system.uuid )

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

	emit( type, system_id, sender_uuid, string ){

		const galaxy = this

		switch( type ){

			// case 'pulse':

			// 	break;

			case 'broadcast':

				if( galaxy.systems[ system_id ] ){

					const pilots = galaxy.systems[ system_id ].get_pilots()

					for( const uuid of Object.keys( pilots ) ){
						if( !sender_uuid || sender_uuid != uuid ){
							if( galaxy.sockets[ uuid ] )  galaxy.sockets[ uuid ].send( string )
						}
					}

				}else{
					log('flag', 'aborting broadcast to non-existent system: ', system_id )
				}

				break;

			case 'dm':

				log('system', 'FLAG - unfinished DM handler')

				break;

			default: break;

		}

	}








	close_system( uuid ){

		this.systems[ uuid ].entropic = {}
		this.systems[ uuid ].sentient = {}

		// TEMP !  -  re-enable this:
		// this.updateOne()
		// .then( res => {

		// 	log('system', 'closed')

		// }).catch( err => { console.log( 'save System err: ', err ) })

		delete this.systems[ uuid ] // seems to work...

		log('galaxy', 'closed system: ', uuid )

	}


	





	awaken(){

		const galaxy = this

		galaxy.pulse = setInterval( function(){

			Object.keys( galaxy.systems ).forEach( function( id ){

				const packet = {
					type: 'move',
					entropic: {}
				}

				for( const uuid of Object.keys( galaxy.systems[ id ].entropic ) ){

					packet.entropic[ uuid ] = {
						mom: galaxy.systems[ id ].entropic[ uuid ].ref.momentum || { x: 0, y: 0, z: 0 },
						pos: galaxy.systems[ id ].entropic[ uuid ].ref.position || { x: 0, y: 0, z: 0 },
						quat: galaxy.systems[ id ].entropic[ uuid ].ref.quaternion || { x: 0, y: 0, z: 0, w: 0 }
					}

				}

				galaxy.emit('broadcast', id, false, JSON.stringify( packet ))

			})

		}, 2000 )

	}

}


module.exports = getSingleton