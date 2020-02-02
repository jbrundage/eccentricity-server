const log = require('../log.js')
const lib = require('../lib.js')
const { 
	Vector3,
	Quaternion,
	Object3D
} = require('three')

log('call', 'Entropic.js')


class Entropic {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.uuid = init.uuid

		this.clickable = true

		this.entropy = 'positive'

		this.pc = false
		
		this.model_url = init.model_url || 'Entropics/thing.glb'

		this.ref = init.ref || {}
		this.ref.momentum = this.ref.momentum || new Vector3( lib.tables.momentum.entropic.x, lib.tables.momentum.entropic.y, lib.tables.momentum.entropic.z )
		this.ref.position = this.ref.position || new Vector3()
		this.ref.model = this.ref.model || new Object3D()
		this.ref.boosting = false
		// this.ref.facing = this.ref.facing || new Vector3()
		// this.ref.rotation = this.ref.rotation || new Vector3()
		// this.ref.quaternion = this.ref.quaternion || new Quaternion() //{ x: 0, y: 0, z: 0, w: 0 }

		this.private = init.private || []
		// 'previous'
		this.private.push('private', 'uuid', 'ref', 'model', 'clickable', 'type', 'table', 'entropy', 'model_url', 'temporality')

	}



	drift(){

		this.ref.position.z += 10

	}

}


module.exports = Entropic