const log = require('../../log.js')
const lib = require('../../lib.js')

const Settings = require('../Settings.js')

const DB = require('../../db.js')

const Pilot = require('./sentient/Pilot.js')

const Entry = require('./_Entry.js')

const GALAXY = require('../../single/Galaxy.js')()


log( 'call', 'User.js' )


class User extends Entry {

	constructor( init ){

		super( init )

		init = init || {}

		this.version = init.version || 2  // no init.id means this will un-auth entire session

		this.table = 'users'

		this.id = init.id
		// this.id = lib.glean_ID( [init._id, init.id] ) || lib.unique_id( 'user', GALAXY.users )

		this.active_pilot = init.active_pilot
		this.pilots = init.pilots || []
		// this.PILOT = init.PILOT || new Pilot()
		// init.PILOT = init.PILOT || {}
		// init.PILOT.id = this.id
		// this.PILOT = new Pilot( init.PILOT )

		this.email = init.email || false
		this.level = init.level || 0
		this.confirmed = init.confirmed || 'no'

		this.settings = new Settings( init.settings ) 

		this.last_log = init.last_log || false

		this.bad_packets = 0

		this.non_core_vals = ['socket']

	}

	async touch_user( touch_pilot, touch_ship ){

		const user = this

		// return new Promise( ( resolve, reject ) => {

		if( !touch_pilot ) return user

		user.PILOT = await user.touch_pilot()

		if( !touch_ship ) return user

		user.PILOT.SHIP = await user.PILOT.touch_ship()

		return user

	}


	touch_pilot(){

		const user = this

		const pool = DB.getPool()

		return new Promise( (resolve, reject) => {

			if( !user.active_pilot ) {

				user.PILOT = new Pilot() // builds provisional Pilot

				resolve( user.PILOT ) // already instantiated by gatekeeper()

			}else{

				if( typeof( user.active_pilot ) !== 'number' || user.active_pilot <= 0 ) {
					resolve({
						success: false,
						msg: 'invalid active_pilot'
					})
					return false
				}

				let needs_query = false

				if( user.PILOT ){

					if( user.PILOT.id === user.active_pilot ){

						user.PILOT = new Pilot( user.PILOT )

						resolve({
							success: true,
							pilot: user.PILOT
						})
						return true

					}else{

						needs_query = true

					}

				}else{

					needs_query = true

				}

				if( needs_query ){

					pool.query('SELECT * FROM `pilots` WHERE `id` = ?', [ user.active_pilot ], ( err, results, fields ) => {

						if( err || !results ){
							reject( err )
							return false
						}

						log('flag', 'fetch user pilot: ', results )

						user.PILOT = new Pilot( results[0] )

						resolve({
							success: true,
							pilot: user.PILOT
						})

					})

				}else{

					resolve({
						success: false,
						msg: 'invalid pilot retrieval'
					})

				}

			}

		})

	}


	fetch_pilots() {

		const pool = DB.getPool()

		const user = this

		return new Promise( ( resolve, reject ) => {

			pool.query('SELECT * FROM `pilots` WHERE user_id= ?', [ user.id ], ( err, res, fields ) => {

				if( err ){
					reject( err )
					return false
				}

				console.log(' res:? ', err, res )//, fields )

				const pilots = res

				resolve({
					success: true,
					pilots: pilots
				})

			})

		})

	}




	// async set_pilot ( request ) {

	// 	log('flag', 'called unfinisehd func: set_pilot')

	// 	return false

	// }

}

  
module.exports = User