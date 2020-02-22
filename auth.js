const bcrypt = require('bcryptjs')

// const User = require('../models/User.js');
// const Avatar = require('../models/Avatar.js');

const log = require('./log.js')
const lib = require('./lib.js')

// const axp = require('./pure.js');
// const axst = require('./state.js');
const config = require('./config.js')

const DB = require('./db.js')
// const ax_parcel = require('./_parcel.js');

const SALT_ROUNDS = 10

const User = require('./class/persistent/User.js')

log('call', 'auth.js')





function login_user( request ){

	const pool = DB.getPool()

	const email = request.body.email.toLowerCase().trim()
	const password = request.body.password.trim()

	const err_msg =  'failed to validate user'

	return new Promise( function( resolve, reject ){

		select_user( 'email', email )
		.then( response => {

			// log('flag', 'login: ', response )

			const hash_pw = response.msg.password

			const user = new User( response.msg )

			// log('flag', 'um, what is the user response: ', user )

			if( !user ){
				log('flag', 'failed to find email: ', email)
				resolve({
					success: false,
					msg: err_msg
				})
				return false
			}

			if( !hash_pw ){
				log('flag', 'no password found on user')
				reject()
				return false
			}

			bcrypt.compare( password, hash_pw )
			.then( bcrypt_boolean => {

				if( bcrypt_boolean ){

					request.session.user = user

					resolve({
						success: true,
						msg: 'congrats' // user
					})

				}else{

					resolve({
						success: false,
						msg: err_msg
					})

				}


			}).catch( err => {
				log('flag', 'bcrypt error: ', err )
				resolve({
					success: false,
					msg: err_msg
				})
			})

		}).catch( err => {
			log('flag', 'error validating credentials: ', err )
			resolve({
				success: false,
				msg: err_msg
			})
			return false
		})

		// no need to help hackers:
		// let msg = false
		// if( !lib.is_valid_email( email ) ){
		// 	msg = 'invalid email'
		// }else if( !lib.is_valid_password( password ) ) {
		// 	msg = 'invalid password'
		// }
		// if( msg ){
		// 	resolve({ success: false, msg: msg })
		// 	return false
		// }

	})
}



function register_user( request ){

	return new Promise(function( resolve, reject ){

		if( !request.session.user.id && request.session.user.level <= 0 ){ // should always be the case if routing correctly

			const pool = DB.getPool()

			const email = request.body.email.toLowerCase().trim()
			const pw = request.body.password.trim()

			let invalid = false
			if( !lib.is_valid_email( email )){
				invalid = 'invalid email'
			}else if( !lib.is_valid_password( pw )){
				invalid = 'invalid password'
			}
			if( invalid ){
				resolve({
					success: false,
					msg: invalid
				})
			}

			let salt = bcrypt.genSaltSync( SALT_ROUNDS )
			let hash = bcrypt.hashSync( pw, salt )

			pool.query('INSERT INTO `users` (`email`, `password`, `level`, `confirmed`) VALUES ( ?, ?, 1, false )', [ email, hash ], ( err, result ) => { // INSERT does not return fields

				if( err || !result || typeof( result.insertId ) != 'number' ){
					if( err )  log('flag', 'err user insert: ', err )
					let msg = 'error creating user'
					if( err && err.code === 'ER_DUP_ENTRY' ) msg = 'duplicate email found'
					resolve({
						success: false,
						msg: msg
					})
					return false
				}

				select_user( 'id', result.insertId )
				.then( res => {

					request.session.user = res.msg // should be app logic: new User( res )

					resolve({
						success: true,
						msg: 'congrats'
					})


				}).catch( err => { log('flag', 'select user err: ', err )})

			})

		}else{

			log('flag', 'bad register attempt: ', request.session.user )

			resolve({
				success: false,
				msg: 'user already logged in'
			})
			return false

		}

	})
}






function select_user( type, value ){

	const pool = DB.getPool()

	return new Promise( ( resolve, reject) => {

		let field
		if( type == 'email' ){
			field = '`email`'
		}else if( type == 'id' ){
			field = '`id`'
		}else{
			log('flag', 'invalid user lookup', type )
			resolve({
				success: false,
				msg: 'invalid user lookup'
			})
			return false
		}

		pool.query('SELECT * from `users` WHERE ' + type + ' = ? LIMIT 1', [ value ], ( err, results ) => {

			if( err || !results ){
				if( err )  log('flag', 'error retrieving user: ', err )
				resolve({
					success: false,
					msg: 'error retrieving new user'
				})
				return false
			}

			resolve({
				success: true,
				msg: results[0]
			})

		})

	})

}


	


const logout_user = async( request ) => {

	if( !request.session.user.update )  return false

	const r = await request.session.user.update( ['last_log'], [ new Date().toISOString() ] )

	request.session.destroy()

	return r

}



module.exports = {
	register_user,
	select_user,
	login_user,
	logout_user
}












// function publicize_session(ses){

// 	let public_session = {
// 		id: ses.id,
// 		user: ses.user,
// 		limits:{
// 			pilots: lib.tables.accounts.pilot[ses.user.level]
// 		}
// 	}

// 	return public_session

// }


