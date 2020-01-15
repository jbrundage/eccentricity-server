const log = require('../log.js')
const lib = require('../lib.js')

log('call', 'Entropic.js')


class Entropic {

	constructor( init ){

		init = init || {}

		this.clickable = true

		this.subtype = init.subtype || 'thing'
		
		this.model_url = init.model_url || 'Entropics/thing.glb'

		this.ref = init.ref || {}
		this.ref.momentum = this.ref.momentum || {
			x: lib.tables.momentum.ship.x,
			y: lib.tables.momentum.ship.y,
			z: lib.tables.momentum.ship.z
		}
		
	}

}


module.exports = Entropic