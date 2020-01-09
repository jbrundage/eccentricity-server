const env = require('./env.js')
const mysql = require('mysql')
const assert = require('assert')

// const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo'

let _db

function initDB(callback) {
    
    if (_db) {
        console.warn("trying to init DB redundantly")
        return callback(null, _db)
    }

   	_db = mysql.createConnection({
		host: env.DB.HOST,
		db: env.DB.NAME,
		user: env.DB.USER,
		password: env.DB.PW,
		// debug: // default false
		// trace: // default true
		// ssl: ...
		// socketPath: env.SOCKETPATH // unix socketpath :3
	})

    // _db = new pg.Client({
    //     user: env.db_user,
    //     host: env.db_host,
    //     database: env.db_name,
    //     password: env.db_pw,
    //     port: env.postgres_port,
    // })
    _db.connect(function(){

	    return callback(null, _db)
	    
    })

}

function getDB() {
    assert.ok(_db, "DB has not been initialized, call init first")
    return _db
}

module.exports = {
    getDB,
    initDB
}