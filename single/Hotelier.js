const env = require('../env.js')
const DB = require('../db.js')
const lib = require('../lib.js')
const OID = require('mongodb').ObjectId
const log = require('../log.js')

const User = require('../class/persistent/User.js')
const System = require('../class/persistent/System.js')

const GALAXY = require('./Galaxy.js')()


log( 'call', 'Hotelier.js' )


let hotelier = false


function getSingleton( init ){

	if( hotelier ) return hotelier

	return new Hotelier( init )

}


class Hotelier {

	constructor( init ){

		init = init || {}

	}


	async init_player( socket ){

		if( !socket.request.session.user ){
			socket.disconnect()
			log('hotelier', 'user not initialized for socket: ', socket.id, '(' + socket.request.session.user + ')' )
			return false
		}

		socket.id = socket.request.session.user.id || null // socket.id must match existing 

		if( Object.keys( GALAXY.users ).length > env.MAX_PILOTS ){
			log('hotelier', 'max users reached' )
			return false
		}

		let station_key = socket.request.session.user.PILOT.station_key

		// if( typeof( station_key ) !== 'number' ){
		// 	return 
		// }

		// console.log( socket.request.session.user.PILOT.station_key )

		const SYSTEM = await this.touch_system( station_key )

		if( !SYSTEM ){
			log('hotelier', 'failed to init system' )
			return false
		}

		GALAXY.users[ socket.id ] = new User( socket.request.session.user ) // idk why this instantiation isn't carried over from gatekeeper() but it isn't
		GALAXY.sockets[ socket.id ] = socket

		SYSTEM.entities[ socket.id ] = GALAXY.users[ socket.id ].PILOT.SHIP // !!
		SYSTEM.sentient[ socket.id ] = GALAXY.users[ socket.id ].PILOT // !!

		SYSTEM.bind_player( socket.id )

		GALAXY.sockets[ socket.id ].send( JSON.stringify( {
			type: 'init_session',
			system: SYSTEM,
			user: GALAXY.users[ socket.id ]
		}) )

		SYSTEM.emit('broadcast', socket.id, JSON.stringify( {
			type: 'init_pilot',
			pilot: GALAXY.users[ socket.id ].PILOT  //.core()
		} ) )

	}




	async touch_system( id ){

		const pool = DB.getPool()

		if( GALAXY.systems[ id ] ) { 

			// GALAXY.systems[ id ] = new System( GALAXY.systems[ id ] ) // every player arrival could be way overkill

			if( !GALAXY.pulse ) GALAXY.awaken()

			return GALAXY.systems[ id ]

		}


		// const res = await new Promise( ( resolve, reject ) => {

		pool.query('SELECT * FROM \`systems\` WHERE id = ? LIMIT 1', [ id ], ( err, res, fields ) => {
			if( err || !res ) {
				log('hotelier', 'error sys init: ', err)
				return false
			}

			log('hotelier', 'hydrate system: ', res )

			if( !GALAXY.pulse ) GALAXY.awaken()

			GALAXY.systems[ id ] = new System( res[0] )

			GALAXY.systems[ id ].hydrate()
			.then( ok => {

				return GALAXY.systems[ id ]

			}).catch( err => { log( 'flag', err ); return false } )

		})

		// })
	}


	async create_system( init ){

		const pool = DB.getPool()

		const system = new System()

		const vals = {
			name: system.name,
			reputation: JSON.stringify( system.reputation ),
			traffic: system.traffic
		}

		pool.query('INSERT INTO \`systems\` ( name, reputation, traffic ) VALUES ( ? , ? , ? )')
	}

}


module.exports = getSingleton



