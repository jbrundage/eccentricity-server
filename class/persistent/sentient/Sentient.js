const lib = require('../../../lib.js')
const Ship = require('../entropic/Ship.js')


const Document = require('../_Entry.js')

class Sentient extends Document {

	constructor( init ){

		super( init )

		init = init || {}

		this.id = init.id

		this.entropy = 'negative'

		// this.type // has to come from subclass ...

		this.faction = init.faction || 'neutral'
		this.reputation = init.reputation || {}

		this.fname = init.fname || lib.tables.names.pilots.fname[Math.floor(Math.random() * lib.tables.names.pilots.fname.length)]
		this.lname = init.lname ||  lib.tables.names.pilots.lname[Math.floor(Math.random() * lib.tables.names.pilots.lname.length)]
		this.title = init.title || 'the Innocent'
		this.color = init.color || 'rgb(150, 150, 150)'
		this.portrait = init.portrait || (Math.random() > .5 ? 'anon-male.jpg' : 'anon-female.jpg')

		this.coin = init.coin || 5

		this.private = ['private', 'id']


	}

}


module.exports = Sentient