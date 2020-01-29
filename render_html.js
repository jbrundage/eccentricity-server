const header = function( title, css ){

	return `
		<html>
			<head>
				<title>
					${ title || 'Eccentricity Online' }
				</title>

				<meta charset="utf-8">
			    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
			    <meta property="og:url" content="https://eccentricity.online">
			    <meta property="og:title" content="Eccentricity Online">
			    <meta property="og:description" content="Space merchant MMO"> 
			    <meta property="og:image" content="https://eccentricity.online/resource/media/eccentricity.png"/>

				<link href="data:image/x-icon;base64" rel="icon" type="image/x-icon" />
				<link href='/resource/media/fonts/nanum/NanumMyeongjo-Regular.ttf'>
				<link rel='stylesheet' href='/client/css/base.css?v=3'>
				${ css }

			</head>
	`
}

const includes = `<div id='ecma-warning'>
					This browser's javascript version is not recent enough for this website, sorry.
				</div>`

const auth_links = `<div id='auth-links'>
						<a href='/login'>login</a>
						<a href='/register'>register</a>
					</div>`

const footer = function( scripts ){

	return `${ scripts || '' }
				</body>
			</html>`

}








function render( type ){
	
	let html = ''

	switch( type ){

	case 'index':

		const css = '<link rel=\'stylesheet\' href=\'/client/css/splash.css?v=3\'>'

		const scripts = '<script type=\'module\' src=\'/client/js/auth/init.js?v=3\'></script>'

		return header( false, css ) + `

				<body>

				${ includes }

				<div id='wrap'>
				
					<div class='section'>
						<div id='title' class='display'>Eccentricity<br>Online</div>
						<div id='subtitle' class='display'>an open source javascript MMO in space</div>
					</div>

					${ auth_links }
					
					<div id='content' class='display'>
						<div>
							Hey, somebody left the <a href='/launch'>door</a> open in that puddle jumper...
						</div>
						
						<div id='connect'>
							<div>artist, coder or curious?</div>
							<p>
								<img src='/resource/media/discord-logo.png'><br>
								Join us on Discord:<br>
								<a href='https://discord.gg/K6pwB7m'><br> https://discord.gg/K6pwB7m</a>
							</p>
							<p>
								or message Multy#4146
							</p>
						</div>
					</div>

				</div>

			` + footer( scripts )

		break

	case 'login':

		return `<body class='login'>

				<div id='header'>
					<a href='/' id='logo'>
						<img src='/resource/media/logo.png'>
					</a>
					<div id='auth'>
						<a class='logged-out' href='/login'>login</a>
						<a class='logged-out' href='/register'>register</a>
						<a class='logged-in' href='/logout'>logout</a>
					</div>
				</div>

				<div id='content'>

				<form>
			        
				    <input class='input' id='email' type="text" placeholder="email"/>
			   		<input class='input' id='password' type="password" placeholder="password"/>
			   		<input class='button' type="submit" value="Login" />

			    </form>

				</div>

				<script type='module' src='/client/js/auth/init.js?v=3'></script>

			</body>`
		break

	default: break

	}

}



module.exports = render