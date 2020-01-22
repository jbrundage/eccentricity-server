const log = require('../../log.js');
const DB = require('../../db.js');
const lib = require('../../lib.js');

log( 'call', 'Persistent.js' )



class Persistent {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.uuid = init.uuid

		this.temporality = 'persistent'

	}

	is_hydrated(){

		console.log('err: do not execute is_hydrated, only test exists')

	}

	insertOne(){

		log('flag', 'requested unfinished function insertOne')
		return false

	}


	updateOne( update_query, update_arguments ){

		if( !this.table ) return false

		const doc = this

		const pool = DB.getPool()

		return new Promise( ( resolve, reject ) => {

			log('flag', 'skipping query: ', update_query )
			
			resolve()

			// db.collection( doc.collection ).updateOne({
			// 	_uuid: OID( doc.id )
			// }, {
			// 	$set: doc
			// },{
			// 	upsert: false
			// })
			// .then( res => { resolve( res ) }).catch( err => { reject( err ) })

		})

	}
	

}



module.exports = Persistent

