

const Entropic = require('../../Entropic.js')

class PersistentEntropic extends Entropic {

	constructor( init ){

		super( init )

		init = init || {}

		this.temporality = 'persistent'

		this.align_buffer = init.align_buffer || 5
		this.needs_align = 0


		this.logistic = this.logistic || []
		this.logistic.push('align_buffer', 'needs_align')

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

