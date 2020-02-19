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

		this.pc = init.pc || false

		this.pulse_status = false

		this.log = init.log || false
		
		this.model_url = init.model_url || 'Entropics/thing.glb'

		this.ref = init.ref || {}
		this.ref.momentum = this.ref.momentum || new Vector3().copy( lib.tables.momentum.entropic ) 
		this.ref.position = this.ref.position || new Vector3()
		this.ref.facing = this.ref.facing || new Vector3()
		this.ref.model = this.ref.model || new Object3D()
		this.ref.boosting = false

		this.logistic = init.logistic || []
		// 'previous'
		this.logistic.push('logistic', 'uuid', 'ref', 'model', 'clickable', 'type', 'table', 'entropy', 'model_url', 'temporality', 'pulse_status')

	}



	publish(){

		let r = {}

		for( const key of Object.keys( this )){

			if( key !== 'internal' )  r[ key ] = this[ key ]

		}

		return r

	}



	drift(){

		// this.ref.position.z += 10
		this.ref.position.add( this.ref.momentum )

	}

}


module.exports = Entropic