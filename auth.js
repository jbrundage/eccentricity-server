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





function verify_user( request ){

	const pool = DB.getPool()

	const email = request.body.email.toLowerCase().trim()
	const password = request.body.password

	return new Promise( function( resolve, reject ){

		reject({
			success: false,
			msg: 'accounts not yet available'
		})
		return false

		let msg = false
		if( !lib.is_valid_email( email ) ) msg = 'invalid email'
		if( !lib.is_valid_password( password ) ) msg = 'invalid password'
		if( msg ){

			resolve({ success: false, msg: msg })
			return false
		}

		resolve({ success: true })

		// db.collection('users').findOne({
		// 	email: {$eq: email}
		// }, function(err, res){

		// 	log('auth', 'user verify attempt with password: ' + password, res)

		// 	if(err || !res ){

		// 		resolve({
		// 			success: false,
		// 			msg: 'user does not exist'
		// 		})
		// 		return false
		// 	}

		// 	let u = res


		// 	bcrypt.compare(password, res.password)
		// 	.then(function(res){
		// 		// if(err) log('once', 'aha err: ', err)
		// 		// log('flag', 'compare err: ', err)
		// 		// log('flag', 'compare res: ', res)
		// 		if(res){

		// 			request.session.user = new User(u)

		// 			resolve({
		// 				success: true,
		// 				user: request.session.user
		// 			})
		// 		}else{
		// 			resolve({
		// 				success: false,
		// 				msg: 'wrong password'
		// 			})
		// 		}
		// 	})
		// 	.catch(function(err){
		// 		resolve({
		// 			success: false,
		// 			msg: 'error logging in'
		// 		})
		// 		// return false
		// 	})

		// })

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


	


function logout_user( request ){

	const pool = DB.getPool()

	return new Promise( function( resolve, reject ){

		// reject({msg: 'accounts not yet available'})
		// return false

		// if(request.session.user_id){
		if(request.session.user){
			
			let u

			resolve({ success: true })
				
	  //   	db.collection('users').findOneAndUpdate({
	  //   		_id: request.session.user.id
	  //   	},{
	  //   		$set: {last_log: Date.now()}
	  //   	},{
	  //   		// returnNewDocument: true,
	  //   		returnOriginal: false,
	  //   		upsert: false
	  //   	})
			// .then(function(res){
			// 	let s = true
			// 	let msg = request.session.email + ' logged out'
			// 	log('flag', res.value)
			// 	if(!res.value) {
			// 		msg = 'failed to timestamp logout for : ', request.session.user.email
			// 		log('flag', msg)
			// 		s = false
			// 	}
				
			// 	request.session.destroy()

			// 	resolve({
			// 		success: s,
			// 		msg: msg
			// 	})
			// })
			// .catch(function(err){
			// 	request.session.destroy()
			// 	reject(err)
			// })

		}else{

			resolve({
				success: false,
				msg: 'already logged'
			})

			// reject(ax_parcel('no', 'you are not logged in', 'non-logged logout attempt', {}))

		}
	})

}



module.exports = {
	register_user,
	select_user,
	verify_user,
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


