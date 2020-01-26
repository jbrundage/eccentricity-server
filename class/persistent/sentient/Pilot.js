
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
		
		this.private = this.private || []
		this.private.push('active_ship', 'SHIP')

		this.active_ship = init.active_ship

		this.SHIP = init.SHIP 

		this.ships = init.ships || []

	}



	async touch_ship( position ){

		const pilot = this

		if( pilot.SHIP ){

			log('flag', 'pilot ship?', pilot.SHIP )

			let ship = new Ship( pilot.SHIP )
			ship.uuid = pilot.uuid
			ship.ref = ship.ref || {}
			if( position )  ship.ref.position = position
			return ship

		}else if( pilot.active_ship ){

			if( typeof( pilot.active_ship ) == 'number' && pilot.active_ship > 0 ){

				const pool = db.getPool()

				const { results, fields } = await pool.queryPromise(`SELECT * FROM \`ships\` WHERE id = ? LIMIT 1`, [ pilot.ship_id ] )   //, {

				if( !results ) return false

				let ship = new map[ results[0].type ]( results[0] )
				ship.uuid = pilot.uuid
				return ship  // um yea.. more validation

			}else{

				log('pilot', 'returning default ship, invalid active_ship: ', pilot.active_ship )
				return new Ship({
					uuid: pilot.uuid
				})

			}

		}else{

			log('pilot', 'returning provisional ship')
			return new Ship({
				uuid: pilot.uuid
			})

		}

	}



}


module.exports = Pilot