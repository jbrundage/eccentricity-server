
// NATIVE PACKAGES
const host = require('os').hostname()
const express = require('express')
const http = require('http')
// const https = require('https')
// const path = require('path')
// const fs = require('fs')

// const socketIO = require('socket.io')
// const cors = require('cors')



// MIDDLEWARE
const bodyParser = require('body-parser')
const session = require('express-session')
const cookie = require('cookie')
const cookieParser = require('cookie-parser')

const MemoryStore = require('memorystore')(session)



// LOCAL PACKAGES
const log = require('./log.js')
const DB = require('./db.js')
// const config = require('./config.js')
const env = require('./env.js')
// const env = require(!fs.existsSync("env.js") ? './default_env.js' : './env.js')

// const lib = require('./lib.js')

const query = require('./db_query.js')

const auth = require('./auth.js')

const User = require('./class/Entry/User.js')

const WSS = require('./single/Server.js')()
// const GALAXY = require('./single/Galaxy.js')()
const HOTELIER = require('./single/Hotelier.js')()

// const ecc_read = require('./_ecc-readline.js')
const readline = require('readline')



log('call', 'index-ecc.js')


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


const version = 11

const gatekeep = function(req, res, next) {

	log('gatekeep', req.path )

	if( !req.path.match(/static/) ){

		if( !req.session.user || !req.session.user.version || req.session.user.version != version ){

			req.session.user = new User({
				version: version
			})

		}else{

			req.session.user = new User( req.session.user )

		}

	}

	next()


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


// exp.use('/ws', lru_session)

// exp.use('/', lru_session )
// exp.use('/launch', lru_session )
// exp.use('/sky', lru_session )
// exp.use('/fetch*', lru_session )

exp.use( lru_session )

exp.use( gatekeep )

// exp.use('/', gatekeep )
// exp.use('/launch', gatekeep )
// exp.use('/sky', gatekeep )
// exp.use('/fetch_system', gatekeep )
// exp.use('/fetch_pilots', gatekeep )

// routing
exp.get('/', function(request, response) {
	response.sendFile('/client/html/splash.html', {root: '../'})
	// response.send(erender('/client/html/splash.html.js', request))
})

exp.get('/login*', function(request, response){
	response.sendFile('/client/html/login.html', {root: '../'})
})

exp.get('/credit*', function(request, response){
	response.sendFile('/client/html/credits.html', {root: '../'})
})

exp.get('/launch*', function(request, response){
	response.sendFile('/client/html/launch.html', {root: '../'})
})

exp.get('/register*', function(request, response){
	response.sendFile('/client/html/register.html', {root: '../'})
})

exp.get('/sky*', function(request, response){
	response.sendFile('/client/html/sky.html', {root: '../'})
})

exp.get('/account*', function(request, response){
	response.sendFile('/client/html/account.html', {root: '../'})
})

exp.get('/robots.txt', function(request, response){
	response.sendFile('/robots.txt', {root: '../'}); log('routing', 'bot')
})




exp.get('/fetch_user', function( request, response ){

	response.json( request.session.user )

})


exp.get('/fetch_pilots', function(request, response){

	request.session.user.get_pilots()
		.then(function(res){
			response.status(200).json(res)
		})
		.catch(function(err){
			log('flag', err)
			response.status(500).json(err)
		})
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

exp.post('/fetch_system', function( request, response ){

	query.find_session_system( request )
		.then( res => {
			response.json( res )
		})
		.catch( err => { log( 'flag', 'err fetching system', err ) })

})

exp.post('/login', function(request, response){
	auth.verify_user(request)
		.then(function(res){
			response.status(200).json(res)
		})
		.catch(function(err){
			response.status(500).json(err)
		})
})

exp.post('/register', function(request, response){
	auth.register_user(request)
		.then(function(res){
			response.status(200).json(res)
		})
		.catch(function(err){
			response.status(500).json(err)
		})
})


exp.post('/set_pilot', function(request, response){
	// auth.set_pilot(request)
	request.session.user.set_pilot()
		.then(function(res){
			response.status(200).json(res)
		})
		.catch(function(err){
			response.status(500).json(err)
		})
})

exp.get('/logout', function(request, response){
	auth.logout_user(request)
		.then(function(res){
		// res.redirect('/')
			response.redirect('/')
			// response.sendFile('/client/html/splash.html', {root: __dirname}); log('routing', 'landed root')

		// response.status(200).json(res)
		})
		.catch(function(err){
			response.status(500).json(err)
		})
})



exp.post('*', function(request, response){
	log('routing', 'POST 404: ' + request.url)
	if(request.url.match(/\.html$/)){
		response.status(404).sendFile('/client/html/404.html', { root : __dirname})    
	}else{
		response.end()
	}
})

exp.get('*', function(request, response){
	log('routing', 'GET 404: '  + request.url)
	response.status(404).sendFile('/client/html/404.html', { root : __dirname})    
})
























DB.initDB(function(err, db){

	if(err) return console.error('no db: ', err)
	
	console.log('boot', 'DB init:', Date.now())
  
	server.listen( env.PORT, function() {

		log('boot', 'Starting server on ' + host + ':' + env.PORT, Date.now())

		WSS.on('connection', function connection( socket, req ) {

			// socket.upgradeReq = req // this works for perma-storage but is 20% heavier according to ws man

			const cookies = cookie.parse( req.headers.cookie )
		    const sid = cookieParser.signedCookie( cookies['connect.sid'], env.SECRET )

			STORE.get( sid, function (err, ss) {

				if( err ){

					const msg = 'error retrieving pilot records'

					socket.send(JSON.stringify({
						type: 'error',
						msg: msg
					}))

					log('flag', msg)
					
					return false

				}else {

					if( !ss ) {

						log('flag', 'no session found')
						// return false 
					}else{

					    STORE.createSession( req, ss ) //creates the session object and APPEND on req (!)

						socket.request = req

						HOTELIER.init_player( socket )

					}

				}

			})

		})

	})

})





























// SERVERLOG

if( env.port != 8080 ){ 
		
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'serverlog> '
	})
	
	setTimeout(function(){
		rl.prompt()
	}, 500)

	let readline_last = []
	
	rl.on('line', (line) => {
		switch (line.trim()) {
		case '^[[A':
			try_readline(readline_last[0])
			break
			// case '^[[A^[[A':
			// 	try_readline(readline_last[1])
			// 	break;
			// case '^[[A^[[A^[[A':
			// 	try_readline(readline_last[2])
			// 	break;
		default:
			readline_last.unshift(line.trim())
			try_readline(line.trim())
	   			break
		}
		rl.prompt()
	}).on('close', () => {
		process.exit(0)
	})

	function try_readline( msg ){
		try{ log('serverlog', ( eval(`${msg}`) ) ) }catch(e){ console.log(e) }
	}

}