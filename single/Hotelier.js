const DB = require('../db.js')
const lib = require('../lib.js')
const OID = require('mongodb').ObjectId
const log = require('../log.js')

const User = require('../class/Collection/User.js')
const System = require('../class/Collection/System.js')

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


	init_player( socket ){


		if( socket.request.session.user ){

			socket.id = socket.request.session.user.id || null // socket.id must match existing 

			if( Object.keys( GALAXY.users ).length < 25 ){

				// let system_id = lib.glean_ID( [ socket.request.session.user.PILOT.station_key.system ] )
				let system_id = socket.request.session.user.PILOT.station_key.system

				console.log( socket.request.session.user.PILOT.station_key )

				this.touch_system( system_id )
					.then( SYSTEM  => {

						if( SYSTEM ){

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

						}else{

							log('MONGO', 'Hotelier.js 2')

						}

					}).catch( err => { 
						socket.send(JSON.stringify({
							type: 'error',
							msg: 'failed to find initial system'
						}))
						console.log('err touch_system: ', err) 
					})

			}else{

				console.log('max users reached')

			}

		}else{

			socket.disconnect()
			console.log('user not initialized for socket: ', socket.id, '(' + socket.request.session.user + ')' )

		}

	}



	touch_system( id ){

		const db = DB.getDB()

		return new Promise( (resolve, reject) => {



			// if( !lib.is_mongo_id_string( id ) ){
   //              reject('invalid sys id: ' + id)
   //              return false
   //          }  

			if( !GALAXY.systems[ id ]){

				log('MONGO', 'Hotelier.js')

				resolve()

				// db.collection('system').findOne({

				// 	_id: { $eq: OID( id ) }

				// }, function( err, res ){

				// 	if( err || !res ) {
				// 		console.log('error sys init')
				// 		reject( err )
				// 		return false
				// 	}

				// 	GALAXY.systems[ id ] = new System( res )

				// 	// GALAXY.systems[ id ].touch()
				// 	GALAXY.systems[ id ].hydrate()
				// 	.then( res => {

				// 		console.log( res )

				// 		if( !GALAXY.pulse ) GALAXY.awaken()

				// 		resolve( GALAXY.systems[ id ])

				// 	}).catch( err => { console.log( 'err touch: ', err ) } )

				// })

			}else{

				// GALAXY.systems[ id ] = new System( GALAXY.systems[ id ] ) // hmm

				// GALAXY.systems[ id ].touch()
				// .then( res => {
					
				// 	console.log( res )

				// 	if( !GALAXY.pulse ) GALAXY.awaken()

					resolve( GALAXY.systems[ id ])

				// }).catch( err => { console.log( 'err touch: ', err ) } )

			}

		})

	}

}


module.exports = getSingleton



