const log = require('../log.js')
const lib = require('../lib.js')

log('call', 'Entropic.js')


class Entropic {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.eid = init.eid

		this.clickable = true

		this.entropy = 'positive'
		
		this.model_url = init.model_url || 'Entropics/thing.glb'

		this.ref = init.ref || {}
		this.ref.momentum = this.ref.momentum || {
			x: lib.tables.momentum.entropic.x,
			y: lib.tables.momentum.entropic.y,
			z: lib.tables.momentum.entropic.z
		}
		
		
	}

}


module.exports = Entropic