
const env = require('../../../env.js')
const lib = require('../../../lib.js')
const Station = require('../entropic/Station.js')
const Sentient = require('./Sentient.js')

const GALAXY = require('../../../single/Galaxy.js')()

class Commander extends Sentient {

	constructor( init ){

		super( init )

		init = init || {}

		// client:

		this.id = init.id || lib.unique_id( 'sentient', ( GALAXY.systems[ this.sys_id ] ? ( GALAXY.systems[ this.sys_id ].sentient || {} ) : {} ) )

		this.type = 'commander'

		this.license = init.license || 'provisional'
		this.licensed = init.licensed || Date.now()
		
		this.rep = init.rep || {}

		this.active_station = init.active_station

		// init.STATION = init.STATION || {}
		// init.STATION.id = this.id
		// // this.STATION = new Freighter( init.STATION )
		// this.STATION = new Station( init.STATION )

		// server only:

		// this.station_key = init.station_key || {
		// 	system: env.INIT_SYSTEM_KEY,
		// 	station: this.STATION.id
		// }

		// this.edited = init.edited || 0

		this.coin = init.coin || 100

	}

}


module.exports = Commander