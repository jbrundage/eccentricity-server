

const Entropic = require('../../Entropic.js')

class PersistentEntropic extends Entropic {

	constructor( init ){

		super( init )

		init = init || {}

		this.temporality = 'persistent'

		this.internal = this.internal || []
		this.internal.push('inertia_pos', 'align_buffer')

	}

	is_hydrated(){

		console.log('err: do not execute is_hydrated, only test exists')

	}

	insertOne(){

		log('flag', 'requested unfinished function insertOne')
		return false

	}


	updateOne(){

		if( !this.table ) return false

		const doc = this

		const pool = DB.getPool()

		return new Promise( ( resolve, reject ) => {

			const table = ''
			const id = 0

			pool.query('UPDATE * FROM ? WHERE id = ? ', [ table, id ], ( err, res, fields ) => {
				if( err || !res ){

				}

				log('flag', 'incomplete updateOne')

				resolve()

			})

		})

	}

	
	publish(){

		let r = {}

		for( const key of Object.keys( this )){

			if( key !== 'internal' )  r[ key ] = this[ key ]

		}

		return r

	}
	

}



module.exports = PersistentEntropic

