
const log = require('../../log.js')

const lib = require('../../lib.js')

const Ship = require('./Ship.js')

log('call', 'ShipShuttle.js')


class ShipShuttle extends Ship  {

	constructor( init ){

		super( init )

		init = init || {}

		this.subtype = 'shuttle'
	
		this.model_url = init.model_url || 'ships/shuttle/hopper/model.gltf'

	}


}

module.exports = ShipShuttle