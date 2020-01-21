const env = require('../../env.js')
const log = require('../../log.js')
const lib = require('../../lib.js')

const Station = require('./entropic/Station.js')
const Commander = require('./sentient/Commander.js')
const Pilot = require('./sentient/Pilot.js')

const Asteroid = require('../ephemera/entropic/Asteroid.js')
const Ship = require('./entropic/Ship.js')
const Freighter = require('./entropic/ShipFreighter.js')

const Persistent = require('./_Persistent.js')

// const GALAXY = require('../../single/Galaxy.js')()



const maps = {
	entropic: {
		asteroid: Asteroid,
		ship: Ship,
		freighter: Freighter
	},
	sentient: {
		commander: Commander,
		pilot: Pilot
	}
}

// const WSS = require('../Server.js')()
log( 'call', 'System.js' )

class System extends Persistent {


	constructor( init ){

		super( init )

		init = init || {}

		this.initialized = init.initialized

		this.table = 'system'

		// this.id = lib.glean_ID( [init._id, init.id] )
		this.id = init.id

		this.reputation = init.reputation || {} 
		// this.faction // only access through get_faction()

		this.planet = init.planet
		this.traffic = init.traffic || 5


		// instantiated

		this.sentient = this.validate_ids( init.sentient )
		this.entropic = this.validate_ids( init.entropic )

		this.pulses = {
			npc: false
		}

	}





	async hydrate(){

		if( this.initialized ) {

			// this.hydrate_commanders_with_stations() // still need to init with eid here
			await this.hydrate_sentient()

			await this.hydrate_entropics()

			return 'hydrated'

		}else{

			const p = this.simple_station('primary')
			this.entropic[ p.eid ] = p

			const d = this.simple_station('docking')
			this.entropic[ d.eid ] = d

			const c1 = new Commander({
				eid: lib.unique_id('sentient', this.sentient )
			})
			this.sentient[ c1.eid ] = c1

			const c2 = new Commander({
				eid: lib.unique_id('sentient', this.sentient )
			})
			this.sentient[ c2.eid ] = c2

			p.commander_id = c1.eid
			d.commander_id = c2.eid

			c1.station_id = p.eid
			c2.station_id = d.eid

			this.initialized = true

			await this.updateOne() // ^^ for initialized

			return 'hydrated'

		}

	}





	simple_station( subtype ){

		if( !subtype ) {
			log('flag', 'station must have type' )
			return false
		}

		const station = new Station({
			subtype: subtype,
			eid: lib.unique_id( 'entropic', this.entropic ),
			ref: {
				position: {
					x: lib.tables.position.station[ subtype ].x,
					y: lib.tables.position.station[ subtype ].y,
					z: lib.tables.position.station[ subtype ].z
				}
			}
		})
		
		return station

	}







	// hydrate_commanders_with_stations(){

	// 	const system = this

	// 	let p = false
	// 	let d = false

	// 	for( const eid of Object.keys( system.sentient ) ){

	// 		if( eid && eid != 'undefined' ){

	// 			if( system.sentient[ eid ].type == 'commander' ) {

	// 				system.sentient[ eid ] = new Commander( system.sentient[ eid ] )

	// 				if( system.sentient[ eid ].STATION.subtype == 'primary' ) p = true
	// 				if( system.sentient[ eid ].STATION.subtype == 'docking' ) d = true

	// 			}

	// 		}else{

	// 			log('system', 'invalid sentient: ', system.sentient[ eid ] )

	// 		}

	// 	}

	// 	// systems should not immediately respawn stations like this...

	// 	if( !p ){
	// 		p = new Commander({
	// 			STATION: {
	// 				subtype: 'primary'
	// 			}
	// 		})
	// 		p.STATION.ref.position.x = lib.tables.position.station.primary.x
	// 		p.STATION.ref.position.y = lib.tables.position.station.primary.y
	// 		p.STATION.ref.position.z = lib.tables.position.station.primary.z
	// 		system.entropic[ p.eid ] = p.STATION
	// 	} 

	// 	if( !d ){
	// 		d = new Commander({
	// 			STATION: {
	// 				subtype: 'docking'
	// 			}
	// 		})
	// 		d.STATION.ref.position.x = lib.tables.position.station.docking.x
	// 		d.STATION.ref.position.y = lib.tables.position.station.docking.y
	// 		d.STATION.ref.position.z = lib.tables.position.station.docking.z
	// 		system.entropic[ d.eid ] = d.STATION
	// 	}

	// }
	async hydrate_sentient(){

		const system = this

		let needs_update = false

		for( const id of Object.keys( system.sentient ) ){

			if( id && id != 'undefined' && lib.is_ecc_id( id ) ){

				if( !system.sentient[ id ].is_hydrated ){ 

					let type = system.sentient[ id ].subtype || system.sentient[ id ].type

					if( type && maps.sentient[ type ] ){ 

						const thisClass = maps.sentient[ type ]

						system.sentient[ id ] = new thisClass( system.sentient[ id ] )

					}else{

						log('system', 'missing hydration class map for subtype: ', system.sentient[ id ].subtype )

					}

				}

			}else{

				log('system', 'invalid sentient hydrate id: ' + id + ' :', id )

			}

		}

		if( needs_update ) await system.updateOne()

		return

	}









	async hydrate_entropics(){

		const system = this

		let needs_update = false

		for( const id of Object.keys( system.entropic ) ){

			if( id && id != 'undefined' && lib.is_ecc_id( id ) ){

				if( !system.entropic[ id ].is_hydrated ){ 

					let type = system.entropic[ id ].subtype || system.entropic[ id ].type

					if( type && maps.entropic[ type ] ){ 

						const thisClass = maps.entropic[ type ]

						system.entropic[ id ] = new thisClass( system.entropic[ id ] )

					}else{

						log('system', 'missing hydration class map for subtype: ', system.entropic[ id ].subtype )

					}

				}

			}else{

				log('system', 'invalid entropic hydrate id: ' + id + ' :', id )

			}

		}

		if( needs_update ) await system.updateOne()

		return

	}





	validate_ids( obj ){

		// console.log( obj )

		if( obj ){

			for( const id of Object.keys( obj ) ){

				if( !lib.is_ecc_id( id ) ){
					console.log( 'invalid id: ' + id ) 
					delete obj[ id ]
				}

			}

		}

		return obj || {}

	}













	pulse_npcs(){

		const system = this

		return new Promise( ( resolve, reject ) => {

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

			for( const id of Object.keys( system.entropic ) ){

				// tally desired defenders / misc

				if( system.entropic[ id ].type == 'station' ){

					if( system.entropic[ id ].type == 'primary' || system.entropic[ id ].type == 'station' ){

						defense.capacity += system.entropic[ id ].power

					}

				}else if( system.entropic[ id ].type == 'ship' ){

					if( system.sentient[ id ] ){

						// get current defenders
						if( system.sentient[ id ].reputations[ faction ] > 0 ){

							defense.current++

						// get current misc
						}else if( system.sentient[ id ].reputation[ faction ] === 0 ){

							misc.current++

						}else{

							enemies.current++

						}

					}

				}

			}

			// const missing_misc = misc.capacity - misc.current
			// const missing_defense = defense.capacity - defense.current

			blorb

		})

	}








	get_faction(){

		let high = 0
		let faction = 'none'

		for( const f of Object.keys( this.reputation ) ){

			if( this.reputations[ f ] > high ){

				faction = f

			}

		}

		return faction

	}




	get_station_by_type( type ){ // primary, docking

		let search = false

		for( const id of Object.keys( this.entropic )){

			if( search ){

				log('system', 'duplicate ' + type + ' found' )

			}else if( this.entropic[ id ].type === type ){

				search = this.entropic[ id ]

			}

		}

		return search

	}



	get_pilots(){

		let p = {}

		for( const id of Object.keys( this.sentient ) ) {

			if( this.sentient[ id ].type == 'pilot' ) p[ id ] = this.sentient[ id ]

		}

		return p

	}


















	



	










	

	

	

}

  
module.exports = System