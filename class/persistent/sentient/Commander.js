
const env = require('../../../env.js')
const lib = require('../../../lib.js')
const Station = require('../entropic/Station.js')
const Sentient = require('./_PersistentSentient.js')

const GALAXY = require('../../../single/Galaxy.js')()

class Commander extends Sentient {

	constructor( init ){

		super( init )

		init = init || {}

		// client:

		this.type = 'commander'

		this.table = 'commanders'

		this.license = init.license || 'provisional'
		this.licensed = init.licensed || Date.now()
		
		this.reputation = init.reputation || {}

		this.active_station = init.active_station

		this.STATION = init.STATION

		this.coin = (function(){
			if( init.coin === 0 ) return 0
			return init.coin || 100
		})()

	}

}


module.exports = Commander