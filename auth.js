const bcrypt = require('bcryptjs');

// const User = require('../models/User.js');
// const Avatar = require('../models/Avatar.js');

const log = require('./log.js');
const lib = require('./lib.js');

// const axp = require('./pure.js');
// const axst = require('./state.js');
const config = require('./config.js');

const DB = require('./db.js');
// const ax_parcel = require('./_parcel.js');

const SALT_ROUNDS = 10;

const User = require('./class/persistent/User.js');

log('call', 'auth.js')


const auth = {



	verify_user: function(request){

		const pool = DB.getPool()

		const email = request.body.email.toLowerCase().trim()
		const password = request.body.password

		return new Promise(function(resolve, reject){

			reject({msg: 'accounts not yet available'})
			return false

			let msg = false
			if(!lib.is_valid_email(email)) msg = 'invalid email'
			if(!lib.is_valid_password(password)) msg = 'invalid password'
			if(msg){

				resolve({success: false, msg: msg})
				return false
			}

			log('MONGO', 'auth.js 3')

			resolve()

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
	},

	register_user: function(request){

		return new Promise(function(resolve, reject){

			reject({msg: 'accounts not yet available'})
			return false

			if( !request.session.user.id || request.session.user.id.match(/__/) ){ // should always be the case if routing correctly

			const pool = DB.getPool()

			const email = request.body.email.toLowerCase().trim()

			log('MONGO', 'auth.js')

			resolve()

			// db.collection('users').findOne({

			// 		email: { $eq: email }

			// 	}, function(err, res){

			// 		if(res){

			// 			resolve({
			// 				success: false,
			// 				msg: 'user exists'
			// 			})
			// 			return false

			// 		}else{

			// 			if(lib.is_valid_email(email)){

			// 				if( lib.is_valid_password(request.body.password) ){

			// 					log('once', 'registering with pw: ', request.body.password)

			// 					let salt = bcrypt.genSaltSync(SALT_ROUNDS);
			// 					let hash = bcrypt.hashSync(request.body.password, salt);

			// 					log('once', 'is this the pw: ', hash)

			// 					db.collection('users').insertOne({
			// 						email: email,
			// 						password: hash,
			// 						confirmed: 'no',
			// 						level: 1,
			// 						last_log: Date.now()
			// 					}, function(err, res){

			// 						if(err){
			// 							reject('failed to create user')
			// 							return false
			// 						}

			// 						log('auth', 'user registered: ', email)

			// 						let user = new User(res.ops[0])

			// 						request.session.user = user

			// 						resolve({
			// 							success: true,
			// 							user: user
			// 						})

			// 					})

			// 				}else{

			// 					resolve({
			// 						success: false,
			// 						msg: 'invalid password'
			// 					})
			// 					return false

			// 				}

			// 			}else{

			// 				resolve({
			// 					success: false,
			// 					msg: 'invalid email'
			// 				})
			// 				return false

			// 			}
			// 		}
			// 	}
			// )

		}else{

			log('flag', 'bad register attempt: ', request.session.user)

			resolve({
				success: false,
				msg: 'user already logged in'
			})
			return false
	
		}

		})
	},


	


	logout_user: function(request){

		const pool = DB.getPool()

		return new Promise(function(resolve, reject){

			// reject({msg: 'accounts not yet available'})
			// return false

			// if(request.session.user_id){
			if(request.session.user){
				
				let u

				log('MONGO', 'auth.js 2')

				resolve()
					
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
					msg: 'already logged'
				})

				// reject(ax_parcel('no', 'you are not logged in', 'non-logged logout attempt', {}))

			}
		})

	}

}


module.exports = auth












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


