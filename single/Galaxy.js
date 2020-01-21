const env = require('../env.js')
const log = require('../log.js')
const lib = require('../lib.js')

const DB = require('../db.js')

const System = require('../class/persistent/System.js')

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
		let player = ''
		if( !socket.request.session.user ) player = 'user not found for socket session'
		if( !socket.request.session.user.PILOT ) player = 'pilot not found for user'
		
		if( player !== '' ){
			socket.send( JSON.stringify({
				type: 'error',
				msg: 'failed to init user<br>try reloading once'
			}))
			return false
		}

		let msg = ''
	
		if( Object.keys( this.users ).length > env.MAX_PILOTS ) msg = 'max users reached' 
	
		const station_key = socket.request.session.user.PILOT.station_key

		if( typeof( station_key ) !== 'number' ) msg = 'invalid station key'

		if( msg != '' ){
			socket.disconnect()
			log('galaxy', 'invalid init_player: ', msg)
			return false
		}
		//end validation





		socket.id = lib.unique_id( 'sockets', this.sockets )

		const SYSTEM = await this.touch_system( station_key )

		if( !SYSTEM ){
			log('galaxy', 'failed to init system' )
			return false
		}

		// log('flag', 'sys exam;', SYSTEM )

		this.users[ socket.id ] = socket.request.session.user 
		this.sockets[ socket.id ] = socket

		// if( !this.users[ socket.id ].PILOT.SHIP.eid ) {
		// 	this.users[ socket.id ].PILOT.SHIP.eid = lib.unique_id('entropics', this.entropic )
		// }

		SYSTEM.entropic[ socket.id ] = this.users[ socket.id ].PILOT.SHIP
		SYSTEM.entropic[ socket.id ].eid = socket.id
		// this.users[ socket.id ].PILOT.SHIP.eid = lib.unique_id( 'entropics',  )
		// console.log( this.users[ socket.id ].PILOT.SHIP.sentient_id )

		SYSTEM.sentient[ socket.id ] = this.users[ socket.id ].PILOT 
		SYSTEM.sentient[ socket.id ].eid = socket.id

		this.bind_player( SYSTEM, socket.id )

		this.sockets[ socket.id ].send( JSON.stringify( {
			type: 'init_session',
			system: SYSTEM,
			user: this.users[ socket.id ]
		}) )

		// SYSTEM
		this.emit('broadcast', SYSTEM.id, socket.id, JSON.stringify( { 
			type: 'init_pilot',
			pilot: this.users[ socket.id ].PILOT  //.core()
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








	bind_player( system, socket_id ){

		const galaxy = this

		let packet = {}

		const USER  = galaxy.users[ socket_id ]

		galaxy.sockets[ socket_id ].on('message', function( data ){

			try{ 
				packet = lib.sanitize_packet( JSON.parse( data ) )
			}catch(e){
				USER.bad_packets++
				if( USER.bad_packets > 100 ){
					log('flag', 'packet problem for USER:', USER.id, e )
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
								system.emit('broadcast', system.id, socket_id, JSON.stringify({
									type: 'chat',
									id: socket_id,
									speaker: 'blorb',
									// speaker: GALAXY.users[ socket_id ].PILOT.fname,
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

		galaxy.sockets[ socket_id ].on('close', function( data ){

			const socket = this
			const p_id = socket.id

			delete galaxy.users[ socket.id ]
			delete galaxy.sockets[ socket.id ] // (THIS) ...
			delete system.entropic[ socket.id ]
			delete system.sentient[ socket.id ]

			// for( const id of Object.keys( system.sentient )){ // ya goof
			for( const id of Object.keys( galaxy.sockets )){ 

				// console.log( id, socket.id )

				if( socket.id != id ){

					galaxy.sockets[ id ].send( JSON.stringify({

						type: 'close_pilot',
						pilot_id: p_id

					}) )

				}
			}

			if( Object.keys( system.get_pilots() ).length <= 0 ) galaxy.close_system( system.id )

		})

	}



	close_system( system_id ){

		if( typeof( system_id ) !== 'number' || system_id <= 0 ){
			log('flag', 'invalid close system_id: ', system_id + '(' + typeof( system_id ) + ')' )
			return false
		}

		this.systems[ system_id ].entropic = {}
		this.systems[ system_id ].sentient = {}

		// TEMP !  -  re-enable this:
		// this.updateOne()
		// .then( res => {

		// 	log('system', 'closed')

		// }).catch( err => { console.log( 'save System err: ', err ) })

		delete this.systems[ system_id ] // seems to work...

		log('galaxy', 'closed system: ', system_id )



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

	emit( type, system_id, sender_id, string ){

		const galaxy = this

		switch( type ){

			// case 'pulse':

			// 	break;

			case 'broadcast':

				if( galaxy.systems[ system_id ] ){

					for( const id of Object.keys( galaxy.systems[ system_id ].get_pilots() ) ){

						if( sender_id != id )  galaxy.sockets[ id ].send( string )

					}
				}else{
					log('flag', 'urg')
				}

				break;

			case 'dm':

				log('system', 'FLAG - unfinished DM handler')

				break;

			default: break;

		}

	}


	



	awaken(){

		const galaxy = this

		galaxy.pulse = setInterval( function(){

			Object.keys( galaxy.systems ).forEach( function( key ){

				const packet = {
					type: 'move',
					entropic: {}
				}

				for( const id of Object.keys( galaxy.systems[ key ].entropic ) ){

					packet.entropic[ id ] = {
						mom: galaxy.systems[ key ].entropic[ id ].ref.momentum || { x: 0, y: 0, z: 0 },
						pos: galaxy.systems[ key ].entropic[ id ].ref.position || { x: 0, y: 0, z: 0 },
						quat: galaxy.systems[ key ].entropic[ id ].ref.quaternion || { x: 0, y: 0, z: 0, w: 0 }
					}

				}

				galaxy.emit('broadcast', key, false, JSON.stringify( packet ))

			})

		}, 2000 )

	}

}


module.exports = getSingleton