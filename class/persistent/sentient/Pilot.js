
const env = require('../../../env.js')
const lib = require('../../../lib.js')
const log = require('../../../log.js')
const db =  require('../../../db.js')

const Ship = require('../entropic/Ship.js')
const Freighter = require('../entropic/ShipFreighter.js')
const Sentient = require('./Sentient.js')


class Pilot extends Sentient {

	constructor( init ){

		super( init )

		init = init || {}

		// client:

		this.id = init.id

		this.type = 'pilot'

		this.license = init.license || 'provisional'
		this.licensed = init.licensed || Date.now()
		
		this.reputation = init.reputation || {}

		this.active_ship = init.active_ship 

		this.ships = init.ships || []
		
		// init.SHIP = init.SHIP || {}
		// init.SHIP.id = this.id
		// this.SHIP = new Freighter( init.SHIP )
		// this.SHIP = new Ship( init.SHIP )

		// server only:

		

	}



	async touch_ship(){

		const pilot = this

		if( pilot.active_ship ){

			if( typeof( pilot.active_ship ) !== 'number' ){

				log('flag', 'invalid pilot active_ship: ', pilot)
				return false

			}else{

				if( pilot.SHIP ){

					if( pilot.SHIP.id ) return new Ship( pilot.SHIP )

				}else{

					const pool = db.getPool()

					pool.query(`SELECT * FROM \`ships\` WHERE id = ? LIMIT 1`, [ pilot.active_ship ], ( err, res, fields ) => {

						if( err || !res ){
							log('flag', 'no ship found')
							return false
						}

						log('flag', 'ship return: ', res )

						return {}

					})

				}

			}

		}else{

			pilot.SHIP = new Ship()

			return pilot.SHIP

		}

		

	}


}


module.exports = Pilot