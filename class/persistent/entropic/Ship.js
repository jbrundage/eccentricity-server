
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

		this.subtype = 'ship'

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
		this.thrust = init.thrust || 2 // switching to addition not multiplication  // 1.0000005
		this.turn_speed = init.turn_speed || .5 // aesthetic only

		this.sound = init.sound || {
			boost: 'boost_light'
		}

		this.speed_limit = init.speed_limit || 25

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

		this.scratch = { 
			facing: new Vector3(),
			direction: new Vector3(),
			acceleration: new Vector3(),
			projection: new Vector3(),
			crowfly: 0,
			speed: 0
		}
			

		this.private = this.private || []
		this.private.push( 'equipped' )

	}


	move_towards( destination ){

		if( !destination || !destination.isVector3 ){
			log('npc_move', 'invalid destination given')
			return false
		}

		const remaining_dist = this.ref.position.distanceTo( destination )

		if( remaining_dist <= 3 ){ // safeguard - should never be handled here
			log('npc_move', this.uuid + ' has arrived')
			this.ref.momentum = new Vector3(0,0,0)
			return false
		}

		const S = this.scratch

		S.speed = this.ref.momentum.distanceTo( lib.ORIGIN )
		S.direction.copy( this.ref.momentum ).normalize()
		S.facing.subVectors( destination, this.ref.position ).normalize()

		// le physiques:
		// distance = ( initialSpeed * time ) + ( .5 * acceleration * ( time^2)  )

		let stop_time = ( S.speed - 0 ) / this.thrust
		let stop_distance = .5 * this.thrust * ( stop_time * stop_time )

		const misaligned = new Vector3().subVectors( S.direction, S.facing )
		// const misaligned = 0

		///// determine vector

		if( stop_distance > remaining_dist ){

			if( this.log ) log('npc_move', this.uuid.substr(0, 3) + ' stopping')

			this.ref.boosting = true

			S.facing.subVectors( lib.ORIGIN, S.facing ).normalize()

			// this.ref.position.lerp( destination, .3 )

		}else if( misaligned > .1 || S.speed < ( this.speed_limit - .5 ) ){ // still need thrust to get on course

			if( misaligned > .1 ) log('npc_move', 'correcting misaligned ')

			// if( this.log ) log('npc_move', this.uuid.substr(0, 3) + ' accelerating')

			this.ref.boosting = true

		}else{

			if( this.log ) log('npc_move', this.uuid.substr(0, 3) + ' cruising')

			this.ref.boosting = false

			// cruising en route

		}

		// ///// modify momentum

		if( this.ref.boosting ){

			S.acceleration.copy( S.facing ).multiplyScalar( this.thrust ) // .multiplyScalar( delta_seconds ) // 0 - 5

			if( this.log ) log('npc_move', 'why acc not grow: ', this.ref.momentum )

			S.projection.copy( this.ref.momentum ).add( S.acceleration ) // 0 - 5

			// S.projection.add( S.acceleration ) // 0 - 10 // this will always be double at max flight, and need to be capped ....

			S.crowfly = S.projection.distanceTo( lib.ORIGIN ) // 0 - 10

			if( S.crowfly < this.speed_limit ){ 

				this.ref.momentum.copy( S.projection ) 

				if( this.log ) log('npc_move', 'acc: ', S.facing, S.acceleration, this.thrust )

			}else{

				this.ref.momentum.copy( S.projection.multiplyScalar( this.speed_limit / S.crowfly ) )

				if( this.log ) log('npc_move', 'new momentum tapered: ', this.ref.momentum )

			}

		}

		///// apply momentum

		this.ref.position.add( this.ref.momentum )

		this.ref.model.lookAt( S.facing )

		///// check for arrived

		if( this.ref.position.distanceTo( destination ) < 3 ){

			// log('flag', this.uuid.substr(0, 3) + ': ' + ' arrived')

			this.ref.momentum = new Vector3(0, 0, 0)

			this.ref.boosting = false

			return 'arrived'

		}

	}


}


module.exports = Ship