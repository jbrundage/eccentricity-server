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
	
		if( Object.keys( GALAXY.users ).length > env.MAX_PILOTS ) msg = 'max users reached' 
	
		const station_key = socket.request.session.user.PILOT.station_key

		if( typeof( station_key ) !== 'number' ) msg = 'invalid station key'

		if( msg != '' ){
			socket.disconnect()
			log('hotelier', 'invalid init_player: ', msg)
			return false
		}
		//end validation



		socket.id = lib.unique_id( 'sockets', GALAXY.sockets )

		const SYSTEM = await this.touch_system( station_key )

		if( !SYSTEM ){
			log('hotelier', 'failed to init system' )
			return false
		}

		// log('flag', 'sys exam;', SYSTEM )

		GALAXY.users[ socket.id ] = socket.request.session.user 
		GALAXY.sockets[ socket.id ] = socket

		// if( !GALAXY.users[ socket.id ].PILOT.SHIP.eid ) {
		// 	GALAXY.users[ socket.id ].PILOT.SHIP.eid = lib.unique_id('entities', GALAXY.entities )
		// }

		SYSTEM.entities[ socket.id ] = GALAXY.users[ socket.id ].PILOT.SHIP 
		SYSTEM.entities[ socket.id ].eid = socket.id

		SYSTEM.sentient[ socket.id ] = GALAXY.users[ socket.id ].PILOT 
		SYSTEM.sentient[ socket.id ].eid = socket.id

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


		if( GALAXY.systems[ id ] ) { 

			// GALAXY.systems[ id ] = new System( GALAXY.systems[ id ] ) // every player arrival could be way overkill

			if( !GALAXY.pulse ) GALAXY.awaken()

			return GALAXY.systems[ id ]

		}

		const pool = DB.getPool()

		// const res = await new Promise( ( resolve, reject ) => {
		const sql = 'SELECT * FROM \`systems\` WHERE id = ? LIMIT 1'

		const { results, fields } = await pool.queryPromise( sql, [ id ] )//, ( err, res, fields ) => {
			
		if( !results ) {
			log('hotelier', 'no results: ', results )
			return false
		}

		GALAXY.systems[ id ] = new System( results[0] )

		await GALAXY.systems[ id ].hydrate() // HERE all should have eid's

		if( !GALAXY.pulse ) GALAXY.awaken()

		return GALAXY.systems[ id ]

	}


	async create_system( init ){

		const pool = DB.getPool()

		const system = new System()

		pool.query('INSERT INTO \`systems\` ( name, reputation, traffic ) VALUES ( ? , ? , ? )', [ system.name, system.reputation, system.traffic ], (err, res, fields) => {
			if( err || !res ) {
				log('hotelier', 'error sys init: ', err)
				return false
			}

			return system

		})

	}

}


module.exports = getSingleton



