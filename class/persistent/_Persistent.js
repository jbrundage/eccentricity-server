const log = require('../../log.js');
const DB = require('../../db.js');
const lib = require('../../lib.js');

log( 'call', 'Persistent.js' )



class Persistent {

	constructor( init ){

		init = init || {}
		this.internal = init.internal || {}

		this.id = init.id

		this.uuid = init.uuid

		this.temporality = 'persistent'

		this.logistic = init.logistic || []
		this.logistic.push('id', 'logistic', 'table')


	}

	is_hydrated(){

		console.log('err: do not execute is_hydrated, only test exists')

	}


   // update_query, update_arguments

	update( field_array, value_array ){

		const doc = this

		const pool = DB.getPool()

		return new Promise( ( resolve, reject ) => {

			if( !field_array || !field_array.length || !value_array || !value_array.length || field_array.length !== value_array.length ){
				reject('invalid fields for update')
				return false
			}

			if( !doc.internal.table || !doc.id ) {
				reject('invalid Persistent for update')
				return false
			}

			let values = ''
			for( let i = 0; i < field_array.length; i++ ){
				values +=  '`' + field_array[i] + '`=' 
				if( typeof( value_array[i] == 'string' ) ){
					values += '"' + value_array[i] + '"'
				}else{
					values += value_array[i]
				}
				if( i < field_array.length - 1 ) values += ', '
			}

			const query = 'UPDATE `' + doc.internal.table + '` SET ' + values + ' WHERE `id`=' + doc.id

			pool.query( query, ( err, results ) => {

				if( err || !results ){
					if( err )  log('flag', 'update Persistent error: ', err.sqlMessage, 'attempted: ', '\nATTEMPTED: ', query, doc.internal.table, doc.id )
					reject('failed to update id: ' + doc.id )
					return false
				}

				log('query', 'updated ' + results.affectedRows + ' rows for id: ' + doc.id )

				resolve({
					success: true,
					msg: 'update success'
				})

			} )

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



module.exports = Persistent

