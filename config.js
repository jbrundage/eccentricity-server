const host = require('os').hostname()
const path = require('path');
const log = require('./log.js');
const env = require('./env.js')


const config = {
	  
	root: path.dirname( require.main.filename ),
	public_root: '',
	// db: {
		
		// url: 'mongodb://127.0.0.1:27017/ecc'
	// },
	// for MongoClient:
	// options: {
		// useNewUrlParser: true,
		// useUnifiedTopology: true
	// },
	throttle:{
		user: 3 // 1 signal = ~100
	},

	init_station: 1
	// 5dd6333686a3ea4604e9e8ec
	// ,
	// sendgrid: false
}





if( env.ACTIVE.serverlog ){ 

	const readline = require('readline');
	
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'serverlog> \n'
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
		try{ 
			eval(`${msg}`)
		}catch(e){
			log('serverlog', 'fail: ', e)
		}
	}

}




module.exports = config
