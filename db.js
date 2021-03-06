// const util = require('util')
const log = require('./log.js')

const env = require('./env.js')
const mysql = require('mysql')
const assert = require('assert')

let _pool

function initPool( callback ) {
    
	if ( _pool ) {
		console.log('trying to init pool redundantly')
		return callback(null, _pool)
	}

	//  _pool = mysql.createConnection({
	// 	host: env.DB.HOST,
	// 	db: env.DB.NAME,
	// 	user: env.DB.USER,
	// 	password: env.DB.PW,
	// 	charset: env.DB.CHARSET
	// 	// debug: // default false
	// 	// trace: // default true
	// 	// ssl: ...
	// 	// socketPath: env.SOCKETPATH // unix socketpath :3
	// })

	_pool = mysql.createPool({
		connectionLimit: 10,
		host: env.DB.HOST,
		user: env.DB.USER,
		password: env.DB.PW,
		database: env.DB.NAME,
		charset: env.DB.CHARSET
	})


	const queryPromise = ( ...args ) => new Promise( (resolve, reject) => {
		_pool.query( ...args, (error, results, fields) => {
			resolve({ error, results, fields })
			// if ( error ) {
				// reject( error )
			// } else {
// 
			// }
		})
	})

	_pool.queryPromise = queryPromise

	if( _pool ) log('db', 'pool init')

	return callback( null, _pool )

}

function getPool() {
	assert.ok( _pool, 'Pool has not been initialized, call init first' )
	return _pool
}



module.exports = {
	getPool,
	initPool
}
