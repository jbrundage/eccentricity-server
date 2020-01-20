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








	async init_player( socket ){

		// const galaxy = this

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
		this.emit('broadcast', SYSTEM.eid, socket.id, JSON.stringify( { 
			type: 'init_pilot',
			pilot: this.users[ socket.id ].PILOT  //.core()
		} ) )

	}











	bind_player( system, s_id ){

		let packet = {}

		const USER  = this.users[ s_id ]

		this.sockets[ s_id ].on('message', function( data ){

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
								system.emit('broadcast', s_id, JSON.stringify({
									type: 'chat',
									id: s_id,
									speaker: 'blorb',
									// speaker: GALAXY.users[ s_id ].PILOT.fname,
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

		this.sockets[ s_id ].on('close', function( data ){

			const socket = this
			const p_id = socket.id

			delete this.users[ socket.id ]
			delete this.sockets[ socket.id ] // (THIS) ...
			delete SYSTEM.entropic[ socket.id ]
			delete SYSTEM.sentient[ socket.id ]

			// for( const id of Object.keys( SYSTEM.sentient )){ // ya goof
			for( const id of Object.keys( this.sockets )){ 

				// console.log( id, socket.id )

				if( socket.id != id ){

					this.sockets[ id ].send( JSON.stringify({

						type: 'close_pilot',
						pilot_id: p_id

					}) )

				}
			}

			if( Object.keys( SYSTEM.get_pilots() ).length <= 0 ) SYSTEM.close()

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

	emit( type, system_id, sender_id, string ){

		switch( type ){

			// case 'pulse':

			// 	for( const id of Object.keys( this.get_pilots() ) ){

			// 		GALAXY.sockets[ id ].send( string )

			// 	}
			// 	break;

			case 'broadcast':

				for( const id of Object.keys( this.systems[ system_id ].get_pilots() ) ){

					if( sender_id != id )  this.sockets[ id ].send( string )

				}
				break;

			case 'dm':

				log('system', 'FLAG - unfinished DM handler')

				break;

			default: break;

		}

	}


	



	awaken(){

		const g = this

		this.pulse = setInterval(function(){

			Object.keys( g.systems ).forEach( function( key ){

				const packet = {
					type: 'move',
					entropic: {}
				}

				for( const id of Object.keys( g.systems[ key ].entropic ) ){

					packet.entropic[ id ] = {
						mom: g.systems[ key ].entropic[ id ].ref.momentum || { x: 0, y: 0, z: 0 },
						pos: g.systems[ key ].entropic[ id ].ref.position || { x: 0, y: 0, z: 0 },
						quat: g.systems[ key ].entropic[ id ].ref.quaternion || { x: 0, y: 0, z: 0, w: 0 }
					}

				}

				// g.systems[ key ]
				this.emit('broadcast', key, false, JSON.stringify( packet ))

			})

		}, 2000 )

	}

}


module.exports = getSingleton