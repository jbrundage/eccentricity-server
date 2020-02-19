const { Vector3, Object3D } = require('three')
const lib = require('../../lib.js')
const log = require('../../log.js')
const uuid = require('uuid')
const ProjectileMap = require('./ProjectileMap.js')





class Cannon {

	constructor( init ){

		init = init || {}

		this.type = 'cannon'
		this.subtype = init.subtype
		this.range = init.range || 1500
		this.cooldown = init.cooldown || 1500
		this.animation = init.animation || 'flare'

		this.projectile = init.projectile // should always be instantiated separately

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




class Projectile {

	constructor( init ){

		this.type = 'projectile'
		this.subtype = init.subtype
		this.speed = init.speed || 50
		// this.min_dmg = init.min_dmg || 1
		// this.max_dmg = init.max_dmg || 10
		// this.range = init.range || 500
		// this.cooldown = init.cooldown || 1500
		// this.animation = init.animation || 'flare'

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
		this.lifetime = init.lifetime || 6000

		this.drifting = false
		this.impacted = false
		this.expired = false
		this.exploded = false

		// this.dist = 999999999
		// this.cruise = false
		// this.arrived = false

		this.ref = init.ref || {}
		// this.ref.momentum = this.ref.momentum || new Vector3()
		this.ref.origin = this.ref.origin || new Vector3()
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
		this.target_dist = false

	}

	launch( owner, sys_projectiles ){

		owner.ref.facing.normalize()

		this.ref.position.copy( owner.ref.position )

		this.ref.origin.copy( this.ref.position )

		this.launched = Date.now()

		sys_projectiles[ this.uuid ] = this

		// this.ref.momentum.copy( owner.ref.facing ).multiplyScalar( this.speed )

		// this.ref.position.add( this.ref.momentum )

	}

	traject( target ){

		if( this.launched > 0 && Date.now() - this.launched > this.lifetime ) {
			log('projectile', 'projectile expired: ', ( Date.now() - this.launched ), this.lifetime )
			this.destruct('expired')
			return false
		}

		if( target ){  

			this.ref.facing.subVectors( target.ref.position, this.ref.position ).normalize()

			const projection = this.ref.projection = new Vector3().copy( this.ref.facing ).multiplyScalar( this.speed )

			if( projection.distanceTo( lib.ORIGIN ) > this.ref.position.distanceTo( target.ref.position ) ){
				projection.multiplyScalar( projection.distanceTo( target.ref.position ) / projection.distanceTo( lib.ORIGIN ) )
				this.destruct( 'impacted', target )
			}

			this.ref.position.add( projection )

			this.target_dist = this.ref.position.distanceTo( target.ref.position )

			log('projectile', 'projectile tracking ', target.uuid )

		}else{

			this.drifting = true

			let drift = new Vector3().copy( this.ref.facing ).normalize().multiplyScalar( this.speed )
			this.ref.position.add( drift )

			log('projectile', 'projectile drifting')

		}

	}



	destruct( type, target ){

		log('projectile', 'projectile ' + type.toUpperCase() )

		if( type == 'expired' ){

			this.expired = true

		}else if( type == 'exploded' ){

			this.exploded = true

		}else if( type == 'impacted' ){

			this.impacted = true

			target.health.current -= Math.floor( Math.random() * ( this.max_dmg - this.min_dmg ))

			target.pulse_status = true
		}

		// delete flag - dont delete here, it needs to pulse one last time
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









const ARMATURES = {

	pulse_canister: new Cannon({
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
	ProjectileMap,
	Laser,
	Harvester,
	ARMATURES
}