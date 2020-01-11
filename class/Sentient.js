const log = require('../log.js')

log('call', 'Sentient.js')


class Sentient {

	constructor( init ){

		init = init || {}

		this.subtype = init.subtype || 'sentient'
		
	}

}


module.exports = Sentient