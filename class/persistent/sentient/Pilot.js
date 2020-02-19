
const env = require('../../../env.js')
const lib = require('../../../lib.js')
const log = require('../../../log.js')
const db =  require('../../../db.js')

const { Vector3 } = require('three')

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
		
		this.logistic = this.logistic || []
		this.logistic.push('active_ship', 'SHIP')

		this.active_ship = init.active_ship

		this.SHIP = init.SHIP 

		this.ships = init.ships || []

	}



	async touch_ship( system_key, position ){

		const pilot = this

		if( !system_key ){
			log('flag', 'missing touch_ship system_key: ', system_key )
			return false
		}

		if( pilot.SHIP ){

			let ship = new Ship( pilot.SHIP )
			ship.system_key = system_key
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
				ship.system_key = system_key 
				ship.uuid = pilot.uuid
				return ship  // um yea.. more validation

			}else{

				log('pilot', 'returning default ship, invalid active_ship: ', pilot.active_ship )
				let new_ship = new Ship({
					uuid: pilot.uuid,
					system_key: system_key
				})
				new_ship.ref.position = new Vector3( 0, 0 , -500 )

				return new_ship
			}

		}else{

			log('pilot', 'returning provisional ship')
			let init = {
				uuid: pilot.uuid,
				system_key: system_key
			}
			let new_ship = new Ship( init )

			new_ship.ref.position = new Vector3( 0, 0, -1000 )

			return new_ship

		}

	}



}


module.exports = Pilot