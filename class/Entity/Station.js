
const log = require('../../log.js')

const Entity  = require('./Entity.js')

log('call', 'Station.js')


class Station extends Entity {

	constructor( init ){

		super( init )

		init = init || {}

		this.type = 'station'
		this.subtype = init.subtype

		this.clickable = true

		// this.model_url = init.model_url || 'stations/neutral/primary.glb'
		this.model_url = init.model_url || 'stations/hyranti/untitled.glb'

		// stats
		this.capacity = init.capacity || 50 // players
		this.hangar = init.hangar || 1 // defense ships
		
		this.sections = init.sections || 1
		this.turrets = init.turrets || 0
		this.shields = init.shields || 0
		this.stealth = init.stealth || 0

	}

}


module.exports = Station