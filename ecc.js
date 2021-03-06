
// NATIVE PACKAGES
const host = require('os').hostname()
const express = require('express')
const http = require('http')
// const https = require('https')
// const path = require('path')
// const fs = require('fs')

// const socketIO = require('socket.io')
// const cors = require('cors')


// LOCAL PACKAGES
const log = require('./log.js')
const DB = require('./db.js')
// const config = require('./config.js')
const env = require('./env.js')
// const env = require(!fs.existsSync("env.js") ? './default_env.js' : './env.js')



// NPM 
const bodyParser = require('body-parser')
const session = require('express-session')
const cookie = require('cookie')
const cookieParser = require('cookie-parser')

const MemoryStore = require('memorystore')(session)




// const lib = require('./lib.js')

const query = require('./db_query.js')

const auth = require('./auth.js')

const User = require('./class/persistent/User.js')

const WSS = require('./single/Server.js')()
// const GALAXY = require('./single/Galaxy.js')()
const { getSingleton } = require('./single/Galaxy.js')

// for logging:
const USERS = require('./single/USERS.js')
const SYSTEMS = require('./single/SYSTEMS.js')
const SOCKETS = require('./single/SOCKETS.js')

// const readline = require('readline')

const render = require('../client/html/ecc_html.js')

const GALAXY = getSingleton()

log('call', 'ecc.js')


const STORE = new MemoryStore({
	checkPeriod: 1000 * 60 * 60 * 24 * 2// prune expired entries every 24h
})

// CACHED SESSIONS
const lru_session = session({
	cookie: { maxAge: 1000 * 60 * 60 * 24 * 2 },
	resave: false,
	saveUninitialized: true,
	store: STORE,
	secret: env.SECRET
})


// const version = 14

const gatekeep = function(req, res, next) {

	log('gatekeep', req.path )

	if( req.path.match(/\/resource/) || req.path.match(/\/client/) ){

		next()

	}else{

		req.session.user = new User( req.session.user )

		next()

	}


}

const exp = new express()

const server = http.createServer( exp )








// HTTP ROUTER
// exp.set( 'port', env.PORT )

exp.use('/client', express.static( '../client' )) // __dirname + 
// exp.use('/static', express.static( '../resource' )) // __dirname + 
exp.use('/resource', express.static( '../resource' )) // __dirname + 
// exp.use('/favicon.ico', express.static( '/static/media/favicon.ico') )
// exp.use('/fs', express.static(__dirname + '/fs'))
exp.use( bodyParser.json({ 
	type: 'application/json' 
}))


exp.use( lru_session )

exp.use( gatekeep )

// routing
exp.get('/', function(request, response) {
	response.send( render('index') )
})

exp.get('/login*', function(request, response){
	response.send( render('login') )	
})

exp.get('/register*', function(request, response){
	response.send( render('register') )	
})

exp.get('/credit*', function(request, response){
	response.send( render('credit') )
})

exp.get('/hangar*', function(request, response){
	response.send( render('hangar') )
})

exp.get('/sky*', function(request, response){
	response.send( render('sky'))
})

exp.get('/license*', function(request, response){
	response.send( render('license'))
})

exp.get('/account*', function(request, response){
	response.send( render('account'))
	// response.sendFile('/client/html/account.html', {root: '../'})
})

exp.get('/logout', function( request, response ){
	auth.logout_user( request )
		.then( function( res ){
			response.json( res )
		})
		.catch(function( err ){
			log('flag', 'logout err: ', err )
			response.json({
				success: false,
				msg: 'error logging out'
			})
		})
})

exp.get('/robots.txt', function(request, response){
	response.sendFile('/robots.txt', {root: '../'}); log('routing', 'bot')
})




exp.get('/touch_user', function( request, response ){ // not called from /sky

	(async() => {

		if( !request.session.user.is_hydrated ){
			request.session.user = new User( request.session.user )
		}
		response.json({
			success: true,
			user: request.session.user.publish()
		})

	})()

})


exp.get('/touch_pilot', function( request, response ){

	if( request.session.user.touch_pilot ){

		request.session.user.touch_pilot()
			.then(function( res ){
				response.json( res )
			})
			.catch(function( err ){
				log('flag', 'err getting pilot: ', err )
				response.json({
					success: false,
					err: 'error getting pilot'
				})
			})

	}else{

		log('flag', 'user should be instantiated already: ', request.session.user )
		response.json({
			success: false,
			err: 'failed to get pilot, try logging out and in again'
		})

	}

})



exp.get('/fetch_pilots', function( request, response ){

	if( request.session.user.fetch_pilots ){

		request.session.user.fetch_pilots()
			.then(function( res ){
				response.json( res )
			})
			.catch(function( err ){
				log('flag', 'err fetching pilots: ', err )
				response.json({
					success: false,
					err: 'error fetching pilots'
				})
			})

	}else{

		log('flag', 'user should be instantiated already: ', request.session.user )
		response.json({
			success: false,
			err: 'failed to fetch pilots, try logging out and in again'
		})

	}

})



exp.get('/warn', function(request, response){
	const warnings = [
		'Are you sure thats a good idea?', 
		'Hmm.  On second thought, that carries some stiff jail time.', 
		'You know how to land that thing right?', 
		'I wonder if those stories about toturous pirates in the Outer Rings are true.'
	]

	if(!request.session.warnings) request.session.warnings = 0
	let msg = warnings[request.session.warnings]
	let launch = false
	request.session.warnings++
	if(request.session.warnings > 3) {
		msg ='ah, screw it.'
		launch = '/sky'
	}
	if(request.session.warnings > 4) msg = 'Let\'s try that again shall we...'
	response.json({
		msg: msg,
		launch: launch
	})
})

// ^^ GET
// -------
// vv POST

// exp.post('/seed_galaxy', function( request, response ){

// 	query.seed_galaxy( request )
// 		.then( res => {
// 			response.json( res )
// 		}).catch( err => { log('flag', 'seed_galaxy err: ', err) })

// })

exp.post('/seed_system', function( request, response ){

	query.seed_system( request )
		.then( res => {
			response.json( res )
		}).catch( err => { 
			response.json({
				success: false,
				msg: 'failed to seed system'
			})
			log('flag', 'seed_system err: ', err) 
		})

})

exp.post('/fetch_system', function( request, response ){

	query.find_session_system( request )
		.then( res => {
			response.json( res )
		})
		.catch( err => { 
			log( 'flag', 'err fetching system', err ) 
			response.json({
				success: false,
				msg: 'failed to fetch system'
			})
		})

})

exp.post('/login', function(request, response){
	auth.login_user(request)
		.then(function(res){
			response.json(res)
		})
		.catch(function(err){
			log('flag', 'error logging in: ', err )
			response.json({
				success: false,
				msg: 'error logging in'
			})
		})
})

exp.post('/register', function( request, response ){
	auth.register_user( request )
		.then( function( res ){
			response.json( res )
		})
		.catch(function(err){
			log('flag', 'error registering', err )
			response.json({
				success: false,
				msg: 'error registering'
			})
		})
})


exp.post('/set_pilot', function( request, response ){
	request.session.user.set_pilot( request )
		.then(function( res ){
			response.json( res )
		})
		.catch(function( err ){
			log('flag', 'error choosing pilot', err )
			response.json({
				success: false,
				msg: 'error choosing pilot'
			})
		})
})

exp.post('/create_pilot', function( request, response ){
	request.session.user.create_pilot( request )
		.then(function( res ){
			response.json( res )
		})
		.catch(function( err ){
			log('flag', 'error creating pilot: ', err )
			let msg = 'error creating pilot'
			if( err.code = 'ER_DUP_ENTRY')  msg = 'you already have a pilot by that name'
			response.json({
				success: false,
				msg: msg
			})
		})
})

exp.post('*', function(request, response){
	log('routing', 'POST 404: ' + request.url)
	if(request.url.match(/\.html$/)){
		response.status(404).sendFile('/client/html/404.html', { root : '../' })    
	}else{
		response.end()
	}
})

exp.get('*', function(request, response){
	response.status( 404 ).send( render('404') )
	// response.status(404).sendFile('/client/html/404.html', { root : '../'})    
})
























DB.initPool(( err, db ) => {

	if( err ) return console.error( 'no db: ', err )
	
	log('db', 'init:', Date.now() )
  
	server.listen( env.PORT, function() {

		log( 'boot', 'Starting server on ' + host + ':' + env.PORT, Date.now() )

		WSS.on('connection', function connection( socket, req ) {

			// socket.upgradeReq = req // this works for perma-storage but is 20% heavier according to ws man

			const cookies = cookie.parse( req.headers.cookie )
			const sid = cookieParser.signedCookie( cookies['connect.sid'], env.SECRET )

			STORE.get( sid, function ( err, session ) {

				if( err ){

					const msg = 'error retrieving pilot records'

					socket.send(JSON.stringify({
						type: 'error',
						msg: msg
					}))

					log('flag', 'err: ', msg)
					
					return false

				}else {

					if( !session ) {

						socket.send(JSON.stringify({
							type: 'error',
							msg: 'invalid session - try reloading the page'
						}))
						log('flag', 'no session found')
						// return false 
					}else{

						STORE.createSession( req, session ) //creates the session object and APPEND on req (!)

						socket.request = req

						GALAXY.init_connection( socket )
							.then( res => {
								if( typeof( res ) == 'string' && res.match(/error connecting/i) ){
									socket.send(JSON.stringify({
										type: 'error',
										msg: res
									}))
								}
								log('routing', 'connection initiated: ', socket.uuid )
							}).catch( err => {
								// let msg = 'error initializing connection'
								// if( typeof( err ) == 'string' && err.match(/max users/i) ){
								// 	msg += ', too many users logged in'
								// }
								socket.send(JSON.stringify({
									type: 'error',
									msg: 'error initializing connection'
								}))
								// socket.disconnect()
								log('flag', 'err init_connection: ', err ) 

							})

					}

				}

			})

		})

	})

})
















if( env.ACTIVE.serverlog ){ 

	const readline = require('readline')
	
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'serverlog> \n'
	})
	
	setTimeout(function(){
		rl.prompt()
	}, 500)

	// let readline_last = []
	
	rl.on('line', ( line ) => {

		if( env.READLINE_LITERAL ){	// Mac terminal reads the characters outputted by 'up' literally (?)
			// switch ( line.trim() ) {
			// 	case '^[[A':
			// 		log('flag', 'wut')
			// 		try_readline( readline_last[0] )
			// 		break;
			// 	default:
			// 		readline_last.unshift( line.trim() )
			//	break;
			// }
		}else{
			try_readline( line.trim() )
		}

		rl.prompt()
	}).on('close', () => {
		process.exit( 0 )
	})

}

function try_readline( msg ){
	try{ 
		log( 'serverlog', eval(`${ msg }`) ) //), '\n(command): ' + String( msg ) )
		log( 'serverlog', String( msg ) )
	}catch( e ){
		log('serverlog', 'fail: ', e )
	}
}
