
const lib = require('../lib.js')
const log = require('../log.js')
const env = require('../env.js')

log('call', 'Sentient.js')


class Sentient {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.uuid = init.uuid

		this.entropy = 'negative'

		// this.type // has to come from subclass ...

		this.faction = init.faction || 'neutral'
		this.reputation = init.reputation || {} // factions
		this.relationships = init.relationships || {} // uuids

		this.fname = init.fname || lib.tables.names.pilots.fname[ Math.floor( Math.random() * lib.tables.names.pilots.fname.length ) ]
		this.lname = init.lname ||  lib.tables.names.pilots.lname[ Math.floor( Math.random() * lib.tables.names.pilots.lname.length ) ]
		this.title = init.title || 'the Innocent'
		this.color = init.color || 'rgb(' + lib.random_int( 100, 150 ) + ', ' + lib.random_int( 100, 150 ) + ', ' + lib.random_int( 100, 150 ) + ')'
		this.portrait = init.portrait || ( Math.random() > .5 ? 'anon-male.jpg' : 'anon-female.jpg' )

		this.coin = (function(){
			if( init.coin === 0 ) return 0
			return init.coin || 5
		})()

		this.system_key = init.system_key || env.INIT_SYSTEM_KEY 
		this.station_key = init.station_key || env.INIT_STATION_KEY 

		this.last_pos = init.last_pos || { x: 0, y: 0, z: 0 }

		this.edited = init.edited || 0

		this.private = init.private || []
		this.private.push('private', 'uuid', 'type', 'temporality', 'entropy')
		
	}

}


module.exports = Sentient