const log = require('../log.js')

log('call', 'Entropic.js')


class Entropic {

	constructor( init ){

		init = init || {}

		this.clickable = true

		this.subtype = init.subtype || 'thing'
		
		this.model_url = init.model_url || 'Entropics/thing.glb'
		
	}

}


module.exports = Entropic