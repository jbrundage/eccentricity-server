const log = require('../../log.js')
const lib = require('../../lib.js')

// const Settings = require('../aux/Settings.js')

const DB = require('../../db.js')

const Pilot = require('./sentient/Pilot.js')

const Persistent = require('./_Persistent.js')

// const GALAXY = require('../../single/Galaxy.js')()


log( 'call', 'User.js' )


class User extends Persistent {

	constructor( init ){

		super( init )

		init = init || {}

		this.version = init.version || 2  // no init.id means this will un-auth entire session

		this.table = 'users'

		this.active_pilot = init.active_pilot
		this.PILOT = init.PILOT 

		this.pilots = init.pilots || []

		//|| new Pilot()
		// init.PILOT = init.PILOT || {}
		// init.PILOT.id = this.id
		// this.PILOT = new Pilot( init.PILOT )

		this.email = init.email || false
		this.level = init.level || 0
		this.confirmed = init.confirmed || 'no'

		// this.settings = new Settings( init.settings ) 

		this.last_log = init.last_log || false

		this.bad_packets = 0

		this.private = ['socket']

	}



	touch_pilot(){

		const user = this

		const pool = DB.getPool()

		return new Promise( (resolve, reject) => {

			if( !user.active_pilot ) {

				user.PILOT = new Pilot({
					uuid: user.uuid
				}) // builds provisional Pilot

				// user.active_pilot // active_pilot is a lookup key - only saved pilots get this

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

						if( !user.PILOT.uuid ){
							reject('should already have pilot uuid')
							return false
						}

						resolve({
							success: true,
							pilot: user.PILOT
						})
						return true

					}else{

						log('flag', 'discarding PILOT in favor of discrepant active_pilot')

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

				log('User', 'fetch pilots:', res )//, fields )

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