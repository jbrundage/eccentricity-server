const env = require('../../env.js')
const log = require('../../log.js')
const lib = require('../../lib.js')

const Station = require('./entropic/Station.js')

const Asteroid = require('../ephemera/entropic/Asteroid.js')

const Persistent = require('./_Persistent.js')

const GALAXY = require('../../single/Galaxy.js')()

const Commander = require('./sentient/Commander.js')


const maps = {
	entity: {
		asteroid: Asteroid,
	},
	sentient: {}
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
		this.entities = this.validate_ids( init.entities )

		this.pulses = {
			npc: false
		}

	}





	async hydrate(){

		if( !this.initialized ) {

			this.create_commanders_with_stations()
			this.initialized = true

			log('system', 'creating system')

			await this.updateOne() // just for initialized

			log('flag', 'skipping station commanders')

			return 'hydrated'

		}else{

			log('system', 'hydrating system')

			this.hydrate_commanders_with_stations() // still need to init with eid here

			await this.hydrate_entities()

			return 'hydrated'

		}

	}





	create_commanders_with_stations(){

		const system = this

		const new_p = new Station({
			subtype: 'primary'
		})
		new_p.eid = lib.unique_id( 'entity', system.entities )

		// console.log( new_p , 'what gives' )
		
		system.entities[ new_p.eid ] = new_p

		const new_c = new Commander({
			STATION: system.entities[ new_p.eid ]
		})
		new_c.eid = lib.unique_id( 'sentient', system.sentient )

		// console.log( new_c.STATION , '??')
		
		new_c.STATION.ref.position.x = lib.tables.position.station.primary.x
		new_c.STATION.ref.position.y = lib.tables.position.station.primary.y
		new_c.STATION.ref.position.z = lib.tables.position.station.primary.z

		system.sentient[ new_c.eid ] = new_c


		const new_d = new Station({
			subtype: 'docking'
		})
		new_d.eid = lib.unique_id( 'entity', system.entities )
		
		system.entities[ new_d.eid ] = new_d	
		
		const new_c2 = new Commander({
			STATION: new_d
		})
		new_c2.eid = lib.unique_id( 'sentient', system.sentient )

		new_c2.STATION.ref.position.x = lib.tables.position.station.docking.x
		new_c2.STATION.ref.position.y = lib.tables.position.station.docking.y
		new_c2.STATION.ref.position.z = lib.tables.position.station.docking.z

		system.sentient[ new_c2.eid ] = new_c2

	}






	hydrate_commanders_with_stations(){

		const system = this

		let p = false
		let d = false

		for( const eid of Object.keys( system.sentient ) ){

			if( eid && eid != 'undefined' ){

				if( system.sentient[ eid ].type == 'commander' ) {

					system.sentient[ eid ] = new Commander( system.sentient[ eid ] )

					if( system.sentient[ eid ].STATION.subtype == 'primary' ) p = true
					if( system.sentient[ eid ].STATION.subtype == 'docking' ) d = true

				}

			}else{

				log('system', 'invalid sentient: ', system.sentient[ eid ] )

			}

		}

		// systems should not immediately respawn stations like this...

		if( !p ){
			p = new Commander({
				STATION: {
					subtype: 'primary'
				}
			})
			p.STATION.ref.position.x = lib.tables.position.station.primary.x
			p.STATION.ref.position.y = lib.tables.position.station.primary.y
			p.STATION.ref.position.z = lib.tables.position.station.primary.z
			system.entities[ p.eid ] = p.STATION
		} 

		if( !d ){
			d = new Commander({
				STATION: {
					subtype: 'docking'
				}
			})
			d.STATION.ref.position.x = lib.tables.position.station.docking.x
			d.STATION.ref.position.y = lib.tables.position.station.docking.y
			d.STATION.ref.position.z = lib.tables.position.station.docking.z
			system.entities[ d.eid ] = d.STATION
		}

	}










	hydrate_entities(){

		const system = this

		return new Promise( ( resolve, reject ) => {

			let needs_update = false

			for( const id of Object.keys( system.entities ) ){

				if( id && id != 'undefined' && lib.is_ecc_id( id ) ){

					if( !system.entities[ id ].is_hydrated ){ 

						if( system.entities[ id ].type == 'station' ){ // this means it was not instantiated with Commander

							log('system', 'not hydrated but not found: ', system.entities[ id ] )
							delete system.entities[ id ]
							needs_update = true

						}else{

							if( system.entities[ id ].subtype && maps.entity[ system.entities[ id ].subtype ] ){ // only asteroid currently..

								const thisClass = maps.entity[ system.entities[ id ].subtype ]

								system.entities[ id ] = new thisClass( system.entities[ id ] )

							}else{

								log('system', 'missing hydration class map for subtype: ', system.entities[ id ].subtype )

							}

						}

					}

				}else{

					log('system', 'invalid entity hydrate id: ' + id + ' :', id )

				}

			}

			if( needs_update ){

				system.updateOne()
				.then( res => {
					resolve( 'ok' )
				}).catch( err => { reject('err hydrating entities: ', err )})

			}else{

				resolve( 'ok' )

			}

		})

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

			for( const id of Object.keys( system.entities ) ){

				// tally desired defenders / misc

				if( system.entities[ id ].type == 'station' ){

					if( system.entities[ id ].type == 'primary' || system.entities[ id ].type == 'station' ){

						defense.capacity += system.entities[ id ].power

					}

				}else if( system.entities[ id ].type == 'ship' ){

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

		for( const id of Object.keys( this.entities )){

			if( search ){

				log('system', 'duplicate ' + type + ' found' )

			}else if( this.entities[ id ].type === type ){

				search = this.entities[ id ]

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














	bind_player( s_id ){

		let packet = {}

		const USER  = GALAXY.users[ s_id ]

		const SYSTEM = this

		GALAXY.sockets[ s_id ].on('message', function( data ){

			try{ 
				packet = lib.sanitize_packet( JSON.parse( data ) )
			}catch(e){
				USER.bad_packets++
				if( USER.bad_packets > 100 ){
					log('flag', 'packet problem for USER:', USER.id, e )
				}
			}

			switch( packet.type ){

				case 'move':

					USER.PILOT.SHIP.ref.position = packet.pos || USER.PILOT.SHIP.ref.position
					USER.PILOT.SHIP.ref.quaternion = packet.quat || USER.PILOT.SHIP.ref.quaternion 
					USER.PILOT.SHIP.ref.momentum = packet.mom || USER.PILOT.SHIP.ref.momentum
					break;

				case 'chat':

					switch( packet.method ){
						case 'say':
							const chat = lib.sanitize_chat( packet.chat )
							if( chat ){
								SYSTEM.emit('broadcast', s_id, JSON.stringify({
									type: 'chat',
									id: s_id,
									speaker: GALAXY.users[ s_id ].PILOT.fname,
									method: packet.method,
									chat: chat,
								}) )
							}else{
								console.log(' invalid chat received ')
							}
							break;

						default: break;

					}

					break;
				case 'combat':
					console.log(packet)
					break;
				case 'action':
					console.log(packet)
					break;
				case 'data':
					console.log(packet)
					break;

				default: break;

			}

		})

		GALAXY.sockets[ s_id ].on('close', function( data ){

			const socket = this
			const p_id = socket.id

			delete GALAXY.users[ socket.id ]
			delete GALAXY.sockets[ socket.id ] // (THIS) ...
			delete SYSTEM.entities[ socket.id ]
			delete SYSTEM.sentient[ socket.id ]

			// for( const id of Object.keys( SYSTEM.sentient )){ // ya goof
			for( const id of Object.keys( GALAXY.sockets )){ 

				// console.log( id, socket.id )

				if( socket.id != id ){

					GALAXY.sockets[ id ].send( JSON.stringify({

						type: 'close_pilot',
						pilot_id: p_id

					}) )

				}
			}

			if( Object.keys( SYSTEM.get_pilots() ).length <= 0 ) SYSTEM.close()

		})

	}



	



	emit( type, sender_id, string ){

		switch( type ){

			// case 'pulse':

			// 	for( const id of Object.keys( this.get_pilots() ) ){

			// 		GALAXY.sockets[ id ].send( string )

			// 	}
			// 	break;

			case 'broadcast':

				for( const id of Object.keys( this.get_pilots() ) ){

					// if( sender_id != id ){
					GALAXY.sockets[ id ].send( string )
					// }

				}
				break;

			case 'dm':

				log('system', 'FLAG - unfinished DM handler')

				break;

			default: break;

		}

	}








	close(){

		this.entities = {}
		this.sentient = {}

		// TEMP !  -  re-enable this:
		// this.updateOne()
		// .then( res => {

		// 	log('system', 'closed')

		// }).catch( err => { console.log( 'save System err: ', err ) })

		delete GALAXY.systems[ this.id ] // seems to work...


	}

	

	

	

}

  
module.exports = System