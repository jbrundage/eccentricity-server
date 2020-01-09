const log = require('../../log.js')

const DB = require('../../db.js');

const Pilot = require('./Sentient/Pilot.js');

const Settings = require('../Settings.js');

const lib = require('../../lib.js');

const Document = require('./Entry.js')

const GALAXY = require('../../single/Galaxy.js')()


log( 'call', 'User.js' )


class User extends Document {

	constructor( init ){

		super( init )

		init = init || {}

		this.version = init.version || 2  // no init.id means this will un-auth entire session

		this.collection = 'user'

		this.id = init.id
		// this.id = lib.glean_ID( [init._id, init.id] ) || lib.unique_id( 'user', GALAXY.users )

		this.pilots = init.pilots || []
		// this.PILOT = init.PILOT || new Pilot()
		init.PILOT = init.PILOT || {}
		init.PILOT.id = this.id
		this.PILOT = new Pilot( init.PILOT )

		this.email = init.email || false
		this.level = init.level || 0
		this.confirmed = init.confirmed || 'no'

		this.settings = new Settings( init.settings ) 

		this.last_log = init.last_log || false

		this.bad_packets = 0

		this.non_core_vals = ['socket']

	}


	async get_pilots ( request ) {

		const db = DB.getDB()

		const id_array = []

		for( let i = 0; i < this.pilots.length; i++ ){
			id_array.push( lib.OID( this.pilots[i] ) )
		}

		const pilots = false

		log('MONGO', 'User.js')

		// const pilots = await db.collection('pilots').find({
		// 	"_id": {
		// 		$in: [ id_array ]
		// 	}
		// }).toArray()

		return {
			success: true,
			pilots: pilots
		}

	}




	async set_pilot ( request ) {

		log('flag', 'called unfinisehd func: set_pilot')

		return false

	}

}

  
module.exports = User