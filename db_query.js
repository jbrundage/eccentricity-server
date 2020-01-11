const env = require('./env.js')

const DB = require('./db.js')

const mysql = require('mysql')

const log = require('./log.js')

// const System = require('./ecc/class/Entry/System.js')

// const GALAXY = require('./ecc/single/Galaxy.js')()

log('call', 'db_query.js')

const r = {

	find_session_system: function( request ){  

		const pool = DB.getPool()

		const sys_id = request.session.user.PILOT.station_key.system

		return new Promise( (resolve, reject) => {

			if( GALAXY.systems[ sys_id ] ){ // should always be true as SYSTEM is initiated with request; this is ajax

				// console.log(' resolving: ', GALAXY.systems[ sys_id ] )
				// GALAXY.systems[ sys_id ] = new System( GALAXY.systems[ sys_id ] )

				// if( env.INIT_SYSTEM_KEY == sys_id )  {

				// 	GALAXY.systems[ sys_id ].initialize()
				// 	.then( res => {

						resolve( {
							success: true,
							system: GALAXY.systems[ sys_id ]
						})

				// 	}).catch( err => { console.log( 'err find_system:', err )} )

				// }

			}else{  // should only be true for random queries

				// db.collection( 'system' ).findOne({
				// 	_id: OID( sys_id )
				// }, ( err, res ) => {

				// 	if( err || !res ){
				// 		reject({
				// 			success: false,
				// 			msg: 'failed to find system'
				// 		})					
				// 		return false
				// 	}

					// let s = new System( res )

					// if( env.INIT_SYSTEM_KEY == sys_id ){

						// s.initialize()
						// .then( res => {

						// 	GALAXY.systems[ sys_id ] = s

						log('MONGO', 'db_query: 65')

							resolve({
								success: true,
								system: {}
								// system: res
								// system: GALAXY.systems[ sys_id ]
							})

						// }).catch( err => { console.log( 'err query: ', err )})

					// }

				// })

			}

		})

	},

	seed_galaxy: async function( req ){

		console.log( req.body )

		if( req.body.key === env.SECRET ){

			console.log( 'ja: ', req.body )

			const pool = DB.getPool()

			pool.query(`
				
				CREATE TABLE users (id SERIAL PRIMARY KEY, 
					type VARCHAR(40) not null, 
					subtype VARCHAR(40) not null, 
					json BLOB not null);

				CREATE TABLE pilots (id SERIAL PRIMARY KEY, 
					type VARCHAR(40) not null, 
					subtype VARCHAR(40) not null, 
					json BLOB not null);
				
				CREATE TABLE ships (id SERIAL PRIMARY KEY, 
					type VARCHAR(40) not null, 
					subtype VARCHAR(40) not null, 
					json BLOB not null);
				
				CREATE TABLE quests (id SERIAL PRIMARY KEY, 
					type VARCHAR(40) not null, 
					subtype VARCHAR(40) not null, 
					json BLOB not null);
				
				CREATE TABLE sentient (id SERIAL PRIMARY KEY, 
					type VARCHAR(40) not null, 
					subtype VARCHAR(40) not null, 
					json BLOB not null);
				
				CREATE TABLE systems (id SERIAL PRIMARY KEY, 
					type VARCHAR(40) not null, 
					subtype VARCHAR(40) not null, 
					json BLOB not null);

			`, ( err, results, field ) => {

				return results

			    // pool.query('INSERT INTO items(type, subtype, json) values($1, $2)', [ data.text, data.complete ])
			    
			})

		}

	},

	seed_system: seed_system,

	query: function( req ){

		if( req.body.key === env.SECRET ){

			const pool = DB.getPool()

			pool.query( req.body.query, ( err, res, fields) =>{

				console.log('query done: ', res )

			})

		}

	}

}


module.exports = r







async function seed_system( req ){



}