
const env = require('../../../env.js')
const lib = require('../../../lib.js')
const log = require('../../../log.js')
const db =  require('../../../db.js')

const Ship = require('../entropic/Ship.js')
const Freighter = require('../entropic/ShipFreighter.js')
// const Sentient = require('./Sentient.js')
const Sentient = require('./_PersistentSentient.js')

const map = {
	ship: Ship,
	freighter: Freighter
}



class Pilot extends Sentient {

	constructor( init ){

		super( init )

		init = init || {}

		this.type = 'pilot'

		this.table = 'pilots'

		this.license = init.license || 'provisional'
		this.licensed = init.licensed || Date.now()
		
		this.reputation = init.reputation || {}

		this.active_ship = init.active_ship

		this.SHIP = init.SHIP 

		this.ships = init.ships || []
		
		// server only:

	}



	async touch_ship(){

		const pilot = this

		if( pilot.SHIP ){

			 return new Ship( pilot.SHIP )

		}else if( pilot.active_ship ){

			if( typeof( pilot.active_ship ) == 'number' && pilot.active_ship > 0 ){

				const pool = db.getPool()

				const { results, fields } = await pool.queryPromise(`SELECT * FROM \`ships\` WHERE id = ? LIMIT 1`, [ pilot.ship_id ] )   //, {

				if( !results ) return false

				return new map[ results[0].type ]( results[0] )  // um yea.. more validation

			}else{

				log('pilot', 'returning default ship, invalid active_ship: ', pilot.active_ship )
				return new Ship()

			}

		}else{

			log('pilot', 'returning provisional ship')
			return new Ship()

		}

	}



}


module.exports = Pilot