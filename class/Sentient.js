
const lib = require('../lib.js')
const log = require('../log.js')
const env = require('../env.js')

log('call', 'Sentient.js')


class Sentient {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.eid = init.eid

		this.entropy = 'negative'

		// this.type // has to come from subclass ...

		this.faction = init.faction || 'neutral'
		this.reputation = init.reputation || {}

		this.fname = init.fname || lib.tables.names.pilots.fname[ Math.floor(Math.random() * lib.tables.names.pilots.fname.length) ]
		this.lname = init.lname ||  lib.tables.names.pilots.lname[ Math.floor(Math.random() * lib.tables.names.pilots.lname.length) ]
		this.title = init.title || 'the Innocent'
		this.color = init.color || 'rgb(150, 150, 150)'
		this.portrait = init.portrait || (Math.random() > .5 ? 'anon-male.jpg' : 'anon-female.jpg')

		this.coin = (function(){
			if( init.coin === 0 ) return 0
			return init.coin || 5
		})()

		// this.station_key = init.station_key || {
		this.station_key = init.station_key || env.INIT_STATION_KEY // || {
			// system: env.INIT_SYSTEM_KEY,
			// station: 'primary'
		// }

		this.edited = init.edited || 0

		this.private = ['private', 'id']
		
	}

}


module.exports = Sentient