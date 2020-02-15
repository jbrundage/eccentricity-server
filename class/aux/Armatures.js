const { Vector3 } = require('three')
// const lib = require('../../lib.js')
const uuid = require('uuid')



class Projectile {

	constructor( init ){

		this.type = 'projectile'
		this.subtype = init.subtyp
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

		this.origin = init.origin
		this.vector = new Vector3()

		this.scale = init.scale
		this.sound = this.subtype || this.type
		this.length = init.length || 5
		this.radial_segments = init.radial_segments || 6

		this.proximity = init.proximity
		this.ticks = 0
		this.dist = 999999999
		this.cruise = false
		this.arrived = false

		this.gc = false

		this.target = init.target
		
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