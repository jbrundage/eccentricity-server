
const env = require('../../../env.js')
const lib = require('../../../lib.js')
const Station = require('../entropic/Station.js')
const Sentient = require('./_PersistentSentient.js')


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

		this.coin = (function(){
			if( init.coin === 0 ) return 0
			return init.coin || 100
		})()

		this.private = this.private || []
		this.private.push('active_station', 'STATION')

		this.active_station = init.active_station

		this.STATION = init.STATION

	}

}


module.exports = Commander