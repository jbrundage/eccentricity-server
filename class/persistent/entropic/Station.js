
const log = require('../../../log.js')
const lib = require('../../../lib.js')

// const Entropic  = require('../../Entropic.js')
const Entropic  = require('./_PersistentEntropic.js')

log('call', 'Station.js')


class Station extends Entropic {

	constructor( init ){

		super( init )

		init = init || {}

		this.type = 'station'
		this.subtype = init.subtype

		this.table = 'stations'

		this.clickable = true

		// this.model_url = init.model_url || 'stations/neutral/primary.glb'
		this.model_url = init.model_url || 'stations/hyranti/untitled.glb'

		// stats
		this.capacity = init.capacity || 50 // players
		this.hangar = init.hangar || 1 // defense ships

		this.turrets = init.turrets || 0
		this.shields = init.shields || 0
		this.stealth = init.stealth || 0

		this.ref = init.ref || {}
		this.ref.position = this.ref.position || {
			x: Math.random() * 5000,//lib.tables.position.station.x,
			y: Math.random() * 5000,//lib.tables.position.station.y,
			z: Math.random() * 5000//lib.tables.position.station.z
		}

		this.private = this.private || []

	}

}


module.exports = Station