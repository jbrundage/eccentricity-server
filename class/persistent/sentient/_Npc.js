const lib = require('../../../lib.js')

const Sentient = require('./Sentient.js')

class Npc extends Sentient {

	constructor( init ){

		super( init )

		init = init || {}

		this.type = 'npc'

	}

}


module.exports = Npc