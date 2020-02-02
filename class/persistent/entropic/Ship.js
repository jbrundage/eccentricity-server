
const log = require('../../../log.js')

const lib = require('../../../lib.js')

const { Vector3 } = require('three')

// const Entry = require('../_Entry.js');

const Entropic  = require('./_PersistentEntropic.js')


log('call', 'Ship.js')


class Ship extends Entropic {

	constructor( init ){

		super( init )

		init = init || {}

		this.type = 'ship'

		this.table = 'ships'

		this.clickable = true

		this.capacity = init.capacity || 1
 
		this.model_url = init.model_url || 'ships/shuttle/hopper/model.gltf'
		// this.model_url = init.model_url || 'ships/starship/starship.glb'
		// this.model_url = init.model_url || 'ships/sunbeam2/sunbeam.glb'
		// this.model_url = init.model_url || 'ships/murloc/murloc.glb'
		// this.model_url = init.model_url || 'ships/capital/tuva/untitled.glb'
		// this.model_url = init.model_url || 'ships/ryath/untitled.glb'
		// this.model_url = init.model_url || 'ships/tuva/untitled.glb'
		// this.model_url = init.model_url || 'ships/fighter/spacefighter/spacefighter01.glb'
		// this.model_url = init.model_url || 'ships/fighter/spacefighter/spacefighter02.glb'
		// this.model_url = init.model_url || 'ships/fighter/spacefighter/spacefighter03.glb'

		this.name = init.name || lib.tables.names.ships[ Math.floor( Math.random() * lib.tables.names.ships.length ) ]

		// stats
		this.health = init.health || 100
		this.shields = init.shields || 0
		this.stealth = init.stealth || 0

		this.turrets = init.turrets || 0
		this.equipped = init.equipped || ['pulse_canister', '', '', '']

		// movement
		this.thrust = init.thrust || .0000005 // switching to addition not multiplication  // 1.0000005
		this.turn_speed = init.turn_speed || .5

		this.sound = init.sound || {
			boost: 'boost_light'
		}

		this.speed_limit = init.speed_limit || 5

		// this.ref = this.ref || {}
		// this.ref.position = this.ref.position || new Vector3() //{x: 0, y: 0, z: 0}
		// {
		// 	x: lib.tables.position.ship.x,
		// 	y: lib.tables.position.ship.y,
		// 	z: lib.tables.position.ship.z
		// }


		// instantiated
		this.align_buffer = init.align_buffer || 5
		this.needs_align = 0

		this.move = {
			facing: new Vector3(),
			projection: new Vector3(),
			acceleration: new Vector3(),
			crowfly: 0
		}
			

		this.private = this.private || []
		this.private.push( 'equipped' )



	}


	move_towards( desired_position ){

		// arrive logic
		const dist = this.ref.position.distanceTo( desired_position )

		this.ref.boosting = true

		if( dist < this.speed_limit * 2 ){

			log('flag', this.uuid.substr(0, 3) + ': ' + ' pretty close')

			const runway = this.land( desired_position )
			if( runway == 'arrived' ) return 'arrived'
			return true
		}

		log('flag', this.uuid.substr(0, 3) + ': ' + ' remaining dist:', dist )


		const M = this.move

		M.facing.subVectors( desired_position, this.ref.position ).normalize() // 0 - 1

		M.projection.copy( this.ref.momentum ) // 0 - 5

		M.acceleration.copy( M.facing.addScalar( this.thrust ) ) // .multiplyScalar( delta_seconds ) // 0 - 5

		M.projection.add( M.acceleration ) // 0 - 10 // this will always be double at max flight, and need to be capped ....

		// could use a function that detects 'ideal vector' and then turns off this booster logic 
		// but, 1 fps on server is not too bad ...

		M.crowfly = M.projection.distanceTo( new Vector3(0, 0, 0) ) // 0 - 10




		if( M.crowfly < this.speed_limit ){ // } * 1000 ){ // duh

			// here it is - speed_limit is an arbitrary value.  how to bring to seconds....




			this.ref.momentum.copy( M.projection ) 

			// log('flag', this.uuid.substr(0, 3) + ': ' + ' safe speed', M.projection )

			// .add( M.acceleration )

		}else{

			// log('flag', this.uuid.substr(0, 3) + ': ' + ' too fast')

			this.ref.momentum.copy( M.projection.multiplyScalar( this.speed_limit / M.crowfly ) )

		}

		// log('flag', 'momentum: ', this.ref.momentum )
		// log('flag', 'crowfly: ', M.crowfly )

		this.ref.position.add( this.ref.momentum )

		log('flag', this.uuid.substr(0, 3) + ': ' + ' position: ',  this.ref.position )

		// this.ref.facing.copy( M.facing )

		// this.ref.rotation.copy( M.facing )

		this.ref.model.lookAt( M.facing )

		// this.ref.quaternion.copy( M.facing )

		// ship.momentum.add( facing.multiplyScalar( ship.thrust ) )
			// should not need delta scalar, because clientside divides delta by 1000 to operate in unit seconds, and this is a one second interval

	}



	land( desired_position ){

		log('flag', this.uuid.substr(0, 3) + ': ' + ' in for landing')



		this.ref.position.lerp( desired_position, .3 )

		if( this.ref.position.distanceTo( desired_position ) < 3 ){

			log('flag', this.uuid.substr(0, 3) + ': ' + ' arrived')

			this.ref.boosting = false

			return 'arrived'

		}

	}

}


module.exports = Ship