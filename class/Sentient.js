
const lib = require('../lib.js')
const log = require('../log.js')
const env = require('../env.js')

const { Vector3 } = require('three')

log('call', 'Sentient.js')


class Sentient {

	constructor( init ){

		init = init || {}

		this.id = init.id

		this.uuid = init.uuid

		this.entropy = 'negative'

		// this.type // has to come from subclass ...

		this.faction = init.faction || 'none'
		this.reputation = init.reputation || {} // factions - { name: score }
		this.relationships = init.relationships || {} // uuids - { uuid: { score: n, dist: n } }

		this.fname = init.fname || lib.tables.names.pilots.fname[ Math.floor( Math.random() * lib.tables.names.pilots.fname.length ) ]
		this.lname = init.lname || lib.tables.names.pilots.lname[ Math.floor( Math.random() * lib.tables.names.pilots.lname.length ) ]
		this.title = init.title || 'the Innocent'
		this.color = init.color || 'rgb(' + lib.random_int( 100, 150 ) + ', ' + lib.random_int( 100, 150 ) + ', ' + lib.random_int( 100, 150 ) + ')'
		this.portrait = init.portrait || ( Math.random() > .5 ? 'anon-male.jpg' : 'anon-female.jpg' )

		this.coin = (function(){
			if( init.coin === 0 ) return 0
			return init.coin || 5
		})()

		this.system_key = init.system_key || env.INIT_SYSTEM_KEY 
		this.station_key = init.station_key || env.INIT_STATION_KEY 

		this.last_pos = init.last_pos || new Vector3()

		this.edited = init.edited || 0

		this.e_uuid = init.e_uuid

		this.waypoint = init.waypoint

		this.logistic = init.logistic || []
		this.logistic.push('logistic', 'uuid', 'type', 'temporality', 'entropy')
		
	}



	publish(){

		let r = {}

		for( const key of Object.keys( this )){

			if( key !== 'internal' )  r[ key ] = this[ key ]

		}

		return r

	}



	decide_move( system ){

		let r = {
			type: false
		}

		let orientation = this.get_orientation( system.get('array', 'faction')[0] )

		if( this.e_uuid ){

			r.type = 'engage'
			r.e_uuid = this.e_uuid

		}else if( this.waypoint ){

			r.type = 'waypoint'
			r.waypoint = this.waypoint

		}else if( orientation == 'friend' ) {

			// what to do with stationary :

			r.type = 'waypoint'
			r.waypoint = this.get_new_waypoint( 'friend', system )

			// defender; on patrol; new waypoint

		}else if( orientation == 'enemy' ){

			let e_uuid = this.get_enemy_target( system )
			if( e_uuid ){
				r.type = 'engage'
				r.e_uuid = e_uuid
			}else{
				r.type = 'waypoint'
				r.waypoint = this.get_new_waypoint( 'enemy', system )
			}

		}else{

			r.type = 'waypoint'
			r.waypoint = this.get_new_waypoint( 'traffic', system )

		}

		return r

	}


	get_new_waypoint( type, system ){

		let waypoint = new Vector3()

		const primary = system.get('array', 'entropic', true, 'primary' )[0]
		let origin 
		if( primary ) {
			origin = primary.ref.position
		}else{
			origin = new Vector3()
		}


		if( type == 'enemy' ){

			log('sentient', 'new enemy waypoint')

			const radius = 1000

			waypoint.x = origin.x - ( radius / 2 ) + ( Math.random() * radius )
			waypoint.y = origin.y - ( radius / 2 ) + ( Math.random() * radius )
			waypoint.z = origin.z - ( radius / 2 ) + ( Math.random() * radius )

		}else if( type == 'friend' ){

			log('sentient', 'new friend waypoint')

			const radius = 1000

			waypoint.x = origin.x - ( radius / 2 ) + ( Math.random() * radius )
			waypoint.y = origin.y - ( radius / 2 ) + ( Math.random() * radius )
			waypoint.z = origin.z - ( radius / 2 ) + ( Math.random() * radius )

		}else if( type == 'traffic' ){

			log('sentient', 'new traffic waypoint')

			const radius = 2000

			waypoint.x = origin.x - ( radius / 2 ) + ( Math.random() * radius )
			waypoint.y = origin.y - ( radius / 2 ) + ( Math.random() * radius )
			waypoint.z = origin.z - ( radius / 2 ) + ( Math.random() * radius )

		}

		return waypoint

	}


	get_orientation( system_faction ){

		if( Number( this.reputation[ system_faction ] ) > lib.tables.factions.friend ) return 'friend'
		if( Number( this.reputation[ system_faction ] ) < lib.tables.factions.enemy ) return 'enemy'

		return 'none'

	}






	get_enemy_target( system ){

		// let relationships = system.sentient.npc[ uuid ].relationships
		let relationships = this.relationships

		const sentient = this

		const faction = system.get('array', 'faction')[0]

		const sentients = system.get('object', 'sentient')
		// system.sentient.npc[ uuid ].relationships

		// find nemesis

		let enemy_target = {
			uuid: false,
			score: 0
		}

		let max_dist = 0

		for( const other_uuid of Object.keys( sentients )){

			if( !relationships[ other_uuid ]) {
				relationships[ other_uuid ] = {
					score: sentient.reputation[ sentients[ other_uuid ].relationships[ faction ] ] || 0
				}
			}

			if( relationships[ other_uuid ].score < lib.tables.factions.enemy && relationships[ other_uuid ].score < enemy_target.score ){ 
				relationships[ other_uuid ].dist = lib.THREE.distanceTo( system.entropic[ sentient.uuid ].ref.position, system.entropic[ other_uuid ].ref.position )
				// log('flag', relationships[ other_uuid ].dist + ' units away from supposed enemy')
				if( relationships[ other_uuid ].dist > max_dist )  max_dist = relationships[ other_uuid ].dist
			}
		}

		if( max_dist > 0 ){ // otherwise, no enemies were found to begin with ^^

			let low_score = 0
			for( const other_uuid of Object.keys( relationships )){
				let distance_adjusted = relationships[ other_uuid ].score * ( relationships[ other_uuid ].dist / max_dist )
				if( distance_adjusted < low_score ){
					enemy_target.uuid = other_uuid
				}
			}

			if( enemy_target.uuid < env.MAX_PURSUIT ) return enemy_target.uuid

		}

		return false

	}

}


module.exports = Sentient