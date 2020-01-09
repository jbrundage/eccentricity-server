const log = require('../log.js')
const lib = require('../lib.js')

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

	awaken(){

		const g = this

		this.pulse = setInterval(function(){

			Object.keys( g.systems ).forEach( function( key ){

				const packet = {
					type: 'move',
					entities: {}
				}

				for( const id of Object.keys( g.systems[ key ].entities ) ){

					packet.entities[ id ] = {
						mom: g.systems[ key ].entities[ id ].ref.momentum || { x: 0, y: 0, z: 0 },
						pos: g.systems[ key ].entities[ id ].ref.position || { x: 0, y: 0, z: 0 },
						quat: g.systems[ key ].entities[ id ].ref.quaternion || { x: 0, y: 0, z: 0, w: 0 }
					}

				}

				g.systems[ key ].emit('broadcast', false, JSON.stringify( packet ))

			})

		}, 2000 )

	}

}


module.exports = getSingleton