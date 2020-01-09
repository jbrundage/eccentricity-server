const readline = require('readline')

const env = require('./env.js')
const log = require('./log.js')

log('call', '_ecc-readline.js')

module.exports = function( io, http ){ // arguments are available for reading

	if( env.port != 8080 ){ 
		
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: 'serverlog> '
		});
		
		setTimeout(function(){
			rl.prompt();
		}, 500)

		let readline_last = []
		
		rl.on('line', (line) => {
			switch (line.trim()) {
				case '^[[A':
					try_readline(readline_last[0])
					break;
				// case '^[[A^[[A':
				// 	try_readline(readline_last[1])
				// 	break;
				// case '^[[A^[[A^[[A':
				// 	try_readline(readline_last[2])
				// 	break;
				default:
					readline_last.unshift(line.trim())
					try_readline(line.trim())
		   			break;
			}
			rl.prompt();
		}).on('close', () => {
			process.exit(0);
		});

		function try_readline(msg){
			try{ log('serverlog', ( eval(`${msg}`) ) ) }catch(e){}
		}

	}

}