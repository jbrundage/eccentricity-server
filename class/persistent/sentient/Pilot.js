
const env = require('../../../env.js')
const lib = require('../../../lib.js')
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
		
		this.rep = init.rep || {}

		this.active_ship = init.active_ship 

		this.ships = init.ships || []
		// init.SHIP = init.SHIP || {}
		// init.SHIP.id = this.id
		// this.SHIP = new Freighter( init.SHIP )
		// this.SHIP = new Ship( init.SHIP )

		// server only:

		this.station_key = init.station_key || {
			system: env.INIT_SYSTEM_KEY,
			station: 'primary'
		}

		this.edited = init.edited || 0

		this.coin = init.coin || 5

	}

}


module.exports = Pilot