const { Vector3, Object3D } = require('three')
const lib = require('../../lib.js')
const log = require('../../log.js')
const uuid = require('uuid')




class Projectile {

	constructor( init ){

		this.type = 'projectile'
		this.subtype = init.subtype
		this.speed = init.speed || 25
		this.min_dmg = init.min_dmg || 1
		this.max_dmg = init.max_dmg || 10
		this.range = init.range || 500
		this.cooldown = init.cooldown || 1500
		this.animation = init.animation || 'flare'

		// unique to Projectile:

		this.uuid = init.uuid || uuid()
		this.owner_uuid = init.owner_uuid 
		this.target_uuid = init.target_uuid

		// this.origin = init.origin
		// this.vector = new Vector3()

		this.scale = init.scale || 1
		this.sound = this.subtype || this.type
		this.length = init.length || 5
		this.radial_segments = init.radial_segments || 6

		// this.proximity = init.proximity
		this.launched = 0
		this.lifetime = init.lifetime || 5000
		// this.dist = 999999999
		// this.cruise = false
		// this.arrived = false

		this.ref = init.ref || {}
		// this.ref.momentum = this.ref.momentum || new Vector3()
		this.ref.position = this.ref.position || new Vector3()
		this.ref.facing = this.ref.facing || new Vector3()
		this.ref.model = this.ref.model || new Object3D()

		this.scratch = {
			// direction: new Vector3(),
			// acceleration: new Vector3(),
			projection: new Vector3(),
			// crowfly: 0,
			// speed: 0
		}


		this.gc = false

		this.target = init.target
		
	}

	launch( owner ){

		this.launched = Date.now()

		owner.ref.facing.normalize()

		this.ref.position.copy( owner.ref.position )

		// this.ref.momentum.copy( owner.ref.facing ).multiplyScalar( this.speed )

		// this.ref.position.add( this.ref.momentum )

	}

	traject( target ){

		if( this.launched > 0 && Date.now() - this.launched > this.lifetime ) {
			log('projectile', 'projectile expired: ', ( Date.now() - this.launched ), this.lifetime )
			this.destroy()
			return false
		}

		if( !target ){ // drift
			let drift = new Vector3().copy( this.ref.facing ).normalize().multiplyScalar( this.speed )
			// this.ref.position.add( this.ref.momentum )
			this.ref.position.add( drift )
		}else{

			this.ref.facing.subVectors( target.ref.position, this.ref.position ).normalize()

			const projection = this.ref.projection = new Vector3().copy( this.ref.facing )

			// const scalar = 1 / projection.distanceTo( lib.ORIGIN )

			projection.multiplyScalar( this.speed )// * scalar )

			// log('flag', 'p: ',projection.distanceTo( lib.ORIGIN ) )


			if( projection.distanceTo( lib.ORIGIN ) > projection.distanceTo( target.ref.position ) ){
				projection.multiplyScalar( projection.distanceTo( target.ref.position ) / projection.distanceTo( lib.ORIGIN ) )
				this.impact( target )
			}

			// this.ref.lookAt( this.ref.facing )  // should only be necessary on client

			this.ref.position.add( projection )

			log('projectile', 'projectile pos: ', this.ref.position )

		}

	}


	impact( target ){

		log('projectile', 'projectile impact: ', uuid + ' >> ' + target.uuid )

		target.health -= Math.floor( Math.random() * ( this.max_dmg - this.min_dmg ))

		target.update_status = true

		this.destroy()

	}


	destroy(){

		this.gc = true

	}


	publish(){

		let r = {}

		for( const key of Object.keys( this )){

			if( key !== 'internal' )  r[ key ] = this[ key ]

		}

		return r

	}

}

class Laser {

	constructor( init ){
		this.type = init.type || 'laser'
		this.min_dmg = init.min_dmg || 1
		this.max_dmg = init.max_dmg || 10
		this.range = init.range || 500
		this.cooldown = init.cooldown || 1500
		this.animation = init.animation || 'flare'
	}

}

class Harvester {

	constructor( init ){
		this.type = init.type || 'harvester'
		this.range = init.range || 50
		this.cooldown = init.cooldown || 1500
		this.animation = init.animation || 'harvest'
	}	

}




const ARMATURES = {

	pulse_canister: new Projectile({
		subtype: 'pulse_canister'
	}),

	some_laser: new Laser({
		subtype: 'some_laser',
		cooldown: 100000
	}),

	another_laser: new Laser({
		subtype: 'another_laser',
		cooldown: 2323232
	})

}





module.exports = {
	Projectile,
	Laser,
	Harvester,
	ARMATURES
}