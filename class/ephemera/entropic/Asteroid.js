const log = require('../../../log.js')

const Entropic  = require('../../Entropic.js')

log('call', 'Asteroid.js')


class Asteroid extends Entropic {

	constructor( init ){

		super( init )

		init = init || {}

		this.clickable = true

		this.subtype = 'asteroid'
		
		this.model_url = init.model_url || 'Asteroids/asteroid.glb'
		
		this.mineral = init.mineral || 'debris'

	}

}


module.exports = Asteroid