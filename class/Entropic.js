const log = require('../log.js')
const env = require('../env.js')
const lib = require('../lib.js')
const { 
	Vector3,
	Quaternion,
	Object3D
} = require('three')

const SYSTEMS = require('../single/SYSTEMS.js')

log('call', 'Entropic.js')


class Entropic {

	constructor( init ){

		init = init || {}
		this.internal = init.internal || {}

		this.id = init.id

		this.uuid = init.uuid

		this.system_key = init.system_key

		this.clickable = true

		this.entropy = 'positive'

		this.pc = init.pc || false

		// this.pulse_status = false

		this.health = init.health || {
			current: 100,
			capacity: 100
		}
		this.shields = init.shields || {
			current: 0,
			capacity: 0
		}

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
		// 'pulse_status'
		this.logistic.push('logistic', 'uuid', 'ref', 'model', 'clickable', 'type', 'table', 'entropy', 'model_url', 'temporality')

	}



	resolve_damage( base_dmg ){

		const changes = {}

		const shield_result = this.shields.current - base_dmg
		
		changes.shields = {
			current: Math.max( 0, shield_result ),
			capacity: this.shields.capacity
		}
		if( shield_result < 0 ){
			this.health.current += shield_result // ( yep )
			changes.health = {
				current: Math.max( 0, this.health.current ),
				capacity: this.health.capacity
			}
		}

		log('flag', 'resolved damage:', this.health, this.shields )

		if( this.health.current <= 0 )  SYSTEMS[ this.system_key ].destroy( this.uuid )

		return changes

	}



	is_hydrated(){}




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