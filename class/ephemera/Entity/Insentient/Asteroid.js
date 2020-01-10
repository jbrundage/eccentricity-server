const log = require('../../log.js')

const Entity  = require('./Entity.js')

log('call', 'Asteroid.js')


class Asteroid extends Entity {

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