
const log = require('../../../log.js')

const lib = require('../../../lib.js')

const Ship = require('./Ship.js')

log('call', 'ShipFreighter.js')


class ShipFreighter extends Ship  {

	constructor( init ){

		super( init )

		init = init || {}

		this.subtype = 'freighter'
	
		this.model_url = init.model_url || 'ships/freighter/ryath/untitled.glb'

		// stats
		this.sections = init.sections || 3
		this.turrets = init.turrets || 0
		this.shields = init.shields || 0
		this.stealth = init.stealth || 0

		this.equipped = init.equipped || ['pulse_canister', '', '', '']

		// movement
		this.thrust = init.thrust || .05
		this.turn_speed = init.turn_speed || .1
		this.align_buffer = init.align_buffer || 20

	}


}

module.exports = ShipFreighter