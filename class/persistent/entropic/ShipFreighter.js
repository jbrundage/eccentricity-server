
const log = require('../../../log.js')

const lib = require('../../../lib.js')

const Ship = require('./Ship.js')

log('call', 'ShipFreighter.js')


class Freighter extends Ship  {

	constructor( init ){

		super( init )

		init = init || {}

		this.subtype = 'freighter'
	
		// this.model_url = init.model_url || 'ships/freighter/ryath/untitled.glb'
		this.model_url = init.model_url || 'ships/freighter/Ryath_3_glowstick.glb'

		// stats
		this.health = init.health || {
			current: 300,
			capacity: 300
		}
		this.shields = init.shields || {
			current: 0,
			capacity: 0
		}
		this.fuel = init.fuel || {
			current: 500,
			capacity: 500
		}

		this.sections = init.sections || 3
		this.turrets = init.turrets || 0
		this.equipped = init.equipped || ['pulse_canister', '', '', '']

		// movement
		this.thrust = init.thrust || 1
		this.turn_speed = init.turn_speed || .1 // aesthetic only
		this.align_buffer = init.align_buffer || 20

		this.sound = init.sound || {
			boost: 'boost_heavy'
		}

	}


}

module.exports = Freighter