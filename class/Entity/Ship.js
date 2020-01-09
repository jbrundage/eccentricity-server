
const log = require('../../log.js')

const lib = require('../../lib.js')

const Entity = require('./Entity.js');

log('call', 'Ship.js')


class Ship extends Entity{

	constructor( init ){

		super( init )

		init = init || {}

		this.type = 'ship'

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
		this.sections = init.sections || 1
		this.turrets = init.turrets || 0
		this.shields = init.shields || 0
		this.stealth = init.stealth || 0

		this.equipped = init.equipped || ['pulse_canister', '', '', '']

		// movement
		this.thrust = init.thrust || 1.0000005
		this.turn_speed = init.turn_speed || .5
		this.align_buffer = init.align_buffer || 5
		this.needs_align = 0

		// init.ref = init.ref || {}
		this.ref = init.ref || {}
		this.ref.momentum = this.ref.momentum || {
			x: lib.tables.momentum.ship.x,
			y: lib.tables.momentum.ship.y,
			z: lib.tables.momentum.ship.z
		}
		// this.ref.momentum = init.ref.momentum || lib.tables.momentum.ship
		// this.ref.momentum.x = lib.tables.momentum.ship.x
		// this.ref.momentum.y = lib.tables.momentum.ship.y
		// this.ref.momentum.z = lib.tables.momentum.ship.z

		this.private = init.private || this.private.push('align_buffer', 'equipped', 'needs_align')

	}

}


module.exports = Ship