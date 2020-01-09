const log = require('../../log.js');
const DB = require('../../db.js');
const lib = require('../../lib.js');

log( 'call', 'Entry.js' )



class Entry {

	constructor( init ){

		init = init || {}

		this.root = 'document'

	}

	is_hydrated(){

		console.log('err: do not execute is_hydrated, only test exists')

	}


	// core(){
		
	// 	let core = {}

	// 	for( const key of Object.keys( this )){
	// 		if( !this.non_core_vals.includes( key ) ){
	// 			if( this[ key ].core ){
					
	// 			}
	// 			core[ key ] = this.key
	// 		}
	// 	}

	// 	return core
	// }

	insertOne(){

		log('flag', 'requested unfinished function insertOne')
		return false

	}


	updateOne(){

		if( !this.collection ) return false

		const doc = this

		const db = DB.getDB()

		return new Promise( ( resolve, reject ) => {

			log('MONGO', 'Entry.js')
			resolve()

			// db.collection( doc.collection ).updateOne({
			// 	_id: OID( doc.id )
			// }, {
			// 	$set: doc
			// },{
			// 	upsert: false
			// })
			// .then( res => { resolve( res ) }).catch( err => { reject( err ) })

		})

	}
	

}



module.exports = Entry

