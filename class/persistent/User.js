const log = require('../../log.js')
const env = require('../../env.js')
const lib = require('../../lib.js')

const uuid = require('uuid')

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

		this.version = init.version || 2 

		this.email = init.email || false

		this.level = init.level || 0

		this.PILOT = init.PILOT 
		this.active_pilot = init.active_pilot
		this.pilots_data = init.pilots_data

		this.confirmed = init.confirmed || 'no'

		init.internal = init.internal || {}
		this.internal = {

			bad_packets: 0,

			last_ping: init.internal.last_ping || Date.now(),

			last_log: init.internal.last_log || false,

			table: init.internal.table || 'users'

		}

		this.logistic = []

	}











	touch_pilot( system_key ){

		const user = this

		// const pool = DB.getPool()

		return new Promise( (resolve, reject) => {

			if( user.level === 0 ){ // non-logged

				user.PILOT = new Pilot({
					uuid: user.uuid,
					system_key: system_key 
				}) // builds provisional Pilot

				resolve({ 
					success: true,
					pilot: user.PILOT.publish()
				}) // already instantiated by gatekeeper()
				return

			}else{ // logged in

				let query_type = 'none'

				if( user.active_pilot > 0 ){

					if( !user.PILOT ){

						// log('flag', 'no pilot: ', user.active_pilot )
						query_type = user.active_pilot; 

					}else if( user.active_pilot !== user.PILOT.id ){

						// log('flag', 'wtf: ', user.active_pilot, user.PILOT.id )
						delete user.PILOT
						query_type = user.active_pilot; 

					}else if( !user.PILOT.is_hydrated ){

						log('flag', 'no hydrate: ', user.PILOT.is_hydrated )
						delete user.PILOT
						query_type = user.active_pilot 

					}else{

						query_type = 'valid'; 

					}

				}else{

					query_type = 'restart'

				}

				log('User', 'initializing PILOT with "' + query_type + '" query type')

				if( query_type == 'valid' ){

					resolve({ 
						success: true,
						pilot: user.PILOT.publish()
					})

				}else{

					this.fetch_pilots()
						.then( res => {

							let packet = {}

							if( !res.success || !res.pilots.length ){

								packet = {
									success: false,
									msg: 'failed to fetch pilots'
								}

							}else if( query_type == 'restart' ){

								user.active_pilot = res.pilots[0].id

								user.PILOT = new Pilot( res.pilots[0] )

								packet = {
									success: true,
									pilot: user.PILOT.publish()
								}

							}else if( typeof( query_type ) == 'number' ){ // active_pilot was requested

								let pilot = false

								for( let i = 0; i < res.pilots.length; i++){
									if( res.pilots[i].id === query_type ){
										pilot = res.pilots[i]
									}
								}
								if( pilot ){
									user.PILOT = new Pilot( pilot )
									packet = { 
										success: true,
										pilot: user.PILOT.publish()
									}
								}else{
									delete user.active_pilot
									packet = { 
										success: false,
										msg: 'could not find pilot by active_pilot; reset active; try again' 
									}
								}

							}else{

								log('flag', 'unexpected response: ', res )
								packet = {
									success: false,
									msg: 'failed to fetch pilots'
								}

							}

							resolve( packet )

						}).catch( err => {
							log('flag', 'err fetching pilots: ', err )
							resolve({ success: false, msg: 'failed to fetch pilots' })
						})

				}

			}

		})

	}








	fetch_pilots( deep ) {

		const pool = DB.getPool()

		const user = this

		return new Promise( ( resolve, reject ) => {

			if( !deep && user.pilots_data ){
				resolve({
					success: true,
					pilots: user.pilots_data
				})
				return	
			}

			pool.query('SELECT * FROM `pilots` WHERE user_id= ?', [ user.id ], ( err, res, fields ) => {

				if( err ){
					reject( err )
					return false
				}

				log('User', 'fetch pilots:', res )//, fields )

				user.pilots_data = res

				resolve({
					success: true,
					pilots: user.pilots_data
				})

			})

		})

	}












	async set_pilot ( request ) {

		try{

			let desired_name  = request.body.name

			if( !desired_name ){
				return { 
					success: false, 
					msg: 'unable to set that pilot' 
				}
			}else{
				log('set_pilot', 'ok so desired:', desired_name )
			}

			if( !this.PILOT ){ // we have name but no active_pilot or PILOT

				log('set_pilot', 1)

				if( this.pilots_data ){

				log('set_pilot', 2)

					const name = this.set_pilot_by_name( desired_name )
					if( name ){
						return{
							success: true, 
							pilot: this.PILOT.publish()
						}

					}else{
						return{
							success: false, 
							msg: 'unable to set pilot' 
						}
					}

				}else{	

					log('set_pilot', 3)

					fetch_pilots()
					.then( res => {

						let packet = {}

						if( !res.success || !res.pilots.length ){
							packet = {
								success: false,
								msg: 'failed to fetch pilots'
							}
						}else{

							user.pilots_data = res.pilots

							log('set_pilot', 4)


							const name = set_pilot_by_name( desired_name )
							if( name ){
								packet = {
									success: true, 
									pilot: this.PILOT.publish() 
								}
							}else{
								packet = {
									success: false, 
									msg: 'unable to set pilot' 
								}
							}
						}
						return packet
					})
					// we need to query and set by name
				}

			}else{

				if( !this.PILOT.is_hydrated ) {

					log('set_pilot', 5 )

					this.PILOT = new Pilot( this.PILOT )
				}

				let current_name = this.PILOT.get_name()

				if( current_name == desired_name ){

					log('set_pilot', 5.5 )

					return{
						success: true, 
						pilot: this.PILOT.publish()
					}
				}else{

					log('set_pilot', 6, current_name, desired_name )

					const name = this.set_pilot_by_name( desired_name )
					
					if( name ){
						return{
							success: true, 
							pilot: this.PILOT.publish()
						}
						return
					}else{
						return{
							success: false, 
							msg: 'unable to set pilot' 
						}
					}

				}

			}

			
		}catch(e){
			log('flag', 'errrrr: ', e)
		}

		return false

	}









	set_pilot_by_name( desired ){

		let name = false
		for( let i = 0; i < this.pilots_data.length; i++ ){
			if( this.pilots_data[i].fname + ' ' + this.pilots_data[i].lname === desired ) {
				name = this.pilots_data[i]
				this.PILOT = new Pilot( this.pilots_data[i] )
				this.active_pilot = this.pilots_data[i].id
			}
		}
		return name

	}













		async create_pilot( request ){

		if( typeof( this.id ) != 'number' ){
			return {
				success: false,
				msg: 'must be logged in to create a pilot'
			}
		}

		const fname = request.body.fname
		const lname = request.body.lname
		const portrait = request.body.selected

		log('flag', '-------------------', fname, lname)

		if( !lib.is_valid_name( fname ) || !lib.is_valid_name( lname ) )  return {
			success: false,
			msg: 'invalid names'
		}

		const pool = DB.getPool()

		const query = 'INSERT INTO `pilots` ( fname, lname, portrait, user_id, license ) VALUES ( ?, ?, ?, ?, ? )'
		const vals = [ fname, lname, portrait, this.id, 'initiate' ]

		const { error, results, fields } = await pool.queryPromise( query, vals )
		if( error || !results ){
			if( error ) log('flag', 'error creating record: ', error )
			return {
				success: false,
				msg: 'error creating pilot record'
			}
		}

		log('User', 'create_pilot:', result )//, fields )

		if( result.insertId && typeof( result.insertId ) == 'number' ) {
			request.session.user.active_pilot = result.insertId
		}

		return {
			success: true,
			msg: 'pilot created'
		}

	}

}

  
module.exports = User