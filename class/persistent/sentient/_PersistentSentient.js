
const Sentient = require('../../Sentient.js')


class PersistentEntropic extends Sentient {

	constructor( init ){
		
		super( init )

		init = init || {}

		this.id = init.id

		this.uuid = init.uuid

		this.temporality = 'persistent'

		this.private = this.private || []
		this.private.push('edited', 'portrait', 'table', 'color')

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
	

}



module.exports = PersistentEntropic

