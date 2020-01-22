
const lib = require('../../lib.js')

class Pulse {

	constructor( system ){

		this.system = system

		this.npc = {
			spawn: false,
			think: false
		}

		this.entropic = {
			spawn: false,
			move: false
		}

	}




	init(){

		const pulse = this

		this.npc.spawn = setInterval( function(){

			pulse.start( this.system, 'spawn', 'npc')

		}, lib.tables.pulse.npc.spawn )

		this.npc.think = setInterval( function(){

			pulse.start( this.system, 'think' )

		}, lib.tables.pulse.npc.think )		

		this.entropic.spawn = setInterval( function(){

			pulse.start( this.system, 'spawn', 'entropic' )

		}, lib.tables.pulse.entropic.spawn )

		this.entropic.move = setInterval( function(){

			pulse.start( this.system, 'move' )

		}, lib.tables.pulse.entropic.move )

	}






	start( system, type, cgroup ){

		let defense = {
			current: 0,
			capacity: 0
		}

		let misc = {
			current: 0,
			capacity: system.traffic
		}

		let enemies = {
			current: 0
		}

		const faction = system.get_faction()

		for( const uuid of Object.keys( system.entropic ) ){

			// tally desired defenders / misc

			if( system.entropic[ uuid ].type == 'station' ){

				if( system.entropic[ uuid ].subtype == 'primary' || system.entropic[ uuid ].type == 'station' ){

					defense.capacity += system.entropic[ uuid ].power

				}

			}else if( system.entropic[ uuid ].type == 'ship' ){

				if( system.sentient[ uuid ] ){

					// get current defenders
					if( system.sentient[ uuid ].reputations[ faction ] > 0 ){

						defense.current++

					// get current misc
					}else if( system.sentient[ uuid ].reputation[ faction ] === 0 ){

						misc.current++

					}else{

						enemies.current++

					}

				}

			}

		}

		log('flag', 'pulse: ', defense, misc, enemies )

		// const missing_misc = misc.capacity - misc.current
		// const missing_defense = defense.capacity - defense.current

		// blorb

		// })

	}


	spawn( system, type ){



	}






}






module.exports = Pulse

