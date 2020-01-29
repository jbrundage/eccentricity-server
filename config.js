const host = require('os').hostname()
const path = require('path')
const log = require('./log.js')
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







module.exports = config
