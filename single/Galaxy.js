const env = require('../env.js')
const log = require('../log.js')
const lib = require('../lib.js')

const uuid = require('uuid')

const DB = require('../db.js')

const System = require('../class/persistent/System.js')
const User = require('../class/persistent/User.js')

const SOCKETS = require('./Sockets.js')

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

		this.extant = init.extant

		// this.sockets = init.sockets || {}
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

		if( Object.keys( this.users ).length > env.MAX_PILOTS ) {
			log('galaxy', 'BLOCK LOGIN: max users reached')
			socket.disconnect()
			return false
		}		

		socket.request.session.user = new User( socket.request.session.user )
		socket.request.session.user.PILOT = await socket.request.session.user.touch_pilot()
		socket.request.session.user.PILOT.SHIP = await socket.request.session.user.PILOT.touch_ship()

		const station_key = socket.request.session.user.PILOT.station_key

		if( typeof( station_key ) !== 'number' || station_key <= 0 ) {
			log('galaxy', 'BLOCK LOGIN: invalid station key')
			socket.disconnect()
			return false
		}

		const SYSTEM = await this.touch_system( station_key )

		if( !SYSTEM ){
			log( 'galaxy', 'failed to init system' )
			socket.disconnect()
			return false
		}


		socket.uuid = uuid()
		
		SOCKETS[ socket.uuid ] = socket									// boom
		SOCKETS[ socket.uuid ].uuid = socket.uuid

		this.users[ socket.uuid ] = socket.request.session.user 				// boom 
		this.users[ socket.uuid ].uuid = socket.uuid

		socket.request.session.user.PILOT.uuid = socket.uuid
		socket.request.session.user.PILOT.SHIP.uuid = socket.uuid

		SYSTEM.register_entity( 'entropic', false, this.users[ socket.uuid ].PILOT.SHIP ) 	// boom
		SYSTEM.register_entity( 'sentient', 'pc', this.users[ socket.uuid ].PILOT ) 		// boom 

		this.bind_player( SYSTEM, socket.uuid )

		SOCKETS[ socket.uuid ].send( JSON.stringify( {
			type: 'init_session',
			system: SYSTEM,
			user: this.users[ socket.uuid ],
			uuid: socket.uuid
		}) )

		SYSTEM.broadcast( socket.uuid, JSON.stringify( { 
			type: 'init_pilot',
			pilot: this.users[ socket.uuid ].PILOT  //.core()
		} ) )

	}










	async touch_system( id ){

		// validate

		if( typeof( id ) !== 'number' || id <= 0 ) {
			log('flag', 'invalid system id type: ', id )
			return false
		}

		if( this.systems[ id ] ) { 

			// this.systems[ id ] = new System( this.systems[ id ] ) // every player arrival could be way overkill

			if( !this.extant ) this.bigbang()  // should never be the case

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

		if( !this.extant ) this.bigbang()

		this.systems[ id ] = new System( results[0] )

		// this.systems[ id ].tick( 'on' )

		// log('galaxy', 'SYSTEM post hydrate: ', this.systems[ id ] )

		await this.systems[ id ].bring_online() // HERE all should have eid's

		return this.systems[ id ]

	}








	bind_player( system, uuid ){

		const galaxy = this

		let packet = {}

		const USER  = galaxy.users[ uuid ]

		SOCKETS[ uuid ].on('message', function( data ){

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
``
					USER.PILOT.SHIP.ref.position = packet.pos || USER.PILOT.SHIP.ref.position
					USER.PILOT.SHIP.ref.quaternion = packet.quat || USER.PILOT.SHIP.ref.quaternion 
					USER.PILOT.SHIP.ref.momentum = packet.mom || USER.PILOT.SHIP.ref.momentum
					break;

				case 'chat':

					switch( packet.method ){
						case 'say':
							const chat = lib.sanitize_chat( packet.chat )
							if( chat ){
								system.broadcast( uuid, JSON.stringify({
									type: 'chat',
									uuid: uuid,
									speaker: 'blorb',
									// speaker: GALAXY.users[ uuid ].PILOT.fname,
									method: packet.method,
									chat: chat,
								}) )
							}else{
								log('flag', 'invalid chat received ', packet.chat )
							}
							break;

						default: break;

					}

					break;

				case 'ping_entropic':

					log('flag', 'client is requesting: ', packet )

					SOCKETS[ uuid ].send(JSON.stringify({
						type: 'pong_entropic',
						sentient: system.sentient.pc[ packet.uuid ] || system.sentient.npc[ packet.uuid ],
						entropic: system.entropic[ packet.uuid ]
					}))
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

		SOCKETS[ uuid ].on('close', function( data ){

			const socket = this
			const uuid = socket.uuid

			// log('flag', 'got close:?', uuid )

			delete galaxy.users[ uuid ]
			delete SOCKETS[ uuid ]
			delete system.entropic[ uuid ]
			delete system.sentient[ uuid ]

			// for( const id of Object.keys( system.sentient )){ // ya goof
			for( const uuid of Object.keys( SOCKETS )){ 

				if( socket.uuid != uuid ){

					SOCKETS[ uuid ].send( JSON.stringify({

						type: 'close_pilot',
						uuid: uuid

					}) )

				}
			}

			if( Object.keys( system.get_pilots() ).length <= 0 ) {
				galaxy.close_system( system.id )
			}

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

		this.systems[ id ].entropic = {}
		this.systems[ id ].sentient = {}

		this.systems[ id ].updateOne()
		.then( res => {
			log('system', 'saved system: ', id )
		}).catch( err => { log('flag', 'failed to save system: ', err ) })

		delete this.systems[ id ] // seems to work...

	}


	





	bigbang(){

		const galaxy = this

		log('galaxy', 'bigbang')

		// galaxy.pulse = setInterval( function(){

		// 	Object.keys( galaxy.systems ).forEach( function( id ){

		// 		const packet = {
		// 			type: 'move',
		// 			entropic: {}
		// 		}

		// 		for( const uuid of Object.keys( galaxy.systems[ id ].entropic ) ){

		// 			packet.entropic[ uuid ] = {
		// 				mom: galaxy.systems[ id ].entropic[ uuid ].ref.momentum || { x: 0, y: 0, z: 0 },
		// 				pos: galaxy.systems[ id ].entropic[ uuid ].ref.position || { x: 0, y: 0, z: 0 },
		// 				quat: galaxy.systems[ id ].entropic[ uuid ].ref.quaternion || { x: 0, y: 0, z: 0, w: 0 }
		// 			}

		// 		}

		// 		galaxy.emit('broadcast', id, false, JSON.stringify( packet ))

		// 	})

		// }, 2000 )

	}

}


module.exports = getSingleton