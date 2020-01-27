const log = require('../log.js')
const lib = require('../lib.js')

log('call', 'Entropic.js')


class Entropic {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.uuid = init.uuid

		this.clickable = true

		this.entropy = 'positive'
		
		this.model_url = init.model_url || 'Entropics/thing.glb'

		this.ref = init.ref || {}
		this.ref.momentum = this.ref.momentum || {
			x: lib.tables.momentum.entropic.x,
			y: lib.tables.momentum.entropic.y,
			z: lib.tables.momentum.entropic.z
		}
		this.ref.position = this.ref.position || { x: 0, y: 0, z: 0 }
		this.ref.quaternion = this.ref.quaternion || { x: 0, y: 0, z: 0, w: 0 }

		this.private = init.private || []
		this.private.push('private', 'uuid', 'ref', 'model', 'clickable', 'type', 'table', 'previous', 'entropy', 'model_url', 'temporality')

	}

}


module.exports = Entropic