const lib = require('../../lib.js')
const log = require('../../log.js')
const uuid = require('uuid')

// const Asteroid = require('../ephemera/entropic/Asteroid.js')
const Ship = require('./entropic/Ship.js')
const Freighter = require('./entropic/ShipFreighter.js')

// const Station = require('./entropic/Station.js')
// const Commander = require('./sentient/Commander.js')
const Pilot = require('./sentient/Pilot.js')

const {
	Vector3,
	Quaternion
} = require('three')

module.exports = function initPulse( system ){

	// npc: { spawn }
	// entropic: { spawn, move }

	// const system = this

	/////////////////////////////////////////////////////////////////////////////////////////////// npc spawn

	system.internal.pulses.npc.spawn = setInterval(function(){

		// get defense
		// ( traffic - defense ) = remaining
		// fill defense
		// fill remaining
		// fill hostilities

		let defense = {
			current: 0,
			capacity: 0
		}

		let traffic = {
			current: 0,
			capacity: system.traffic
		}

		let enemies = {
			current: 0,
			capacity: system.volatility
		}

		const faction = system.get('array', 'faction')[0]

		const sentients = system.get('object', 'sentient')

		const primary = system.get('array', 'entropic', true, 'primary')[0]

		for( const uuid of Object.keys( system.entropic ) ){

			// tally desired defenders / traffic

			if( system.entropic[ uuid ].type == 'station' ){

				if( system.entropic[ uuid ].subtype == 'primary' || system.entropic[ uuid ].type == 'station' ){

					defense.capacity += system.entropic[ uuid ].hangar

				}

			}else if( system.entropic[ uuid ].type == 'ship' ){

				// if( sentients.findIndex( (s) => s.uuid === uuid ) ){
				if( sentients[ uuid ]){

					if( !faction || faction == 'none' ){

						traffic.current++

					}else{

						if( sentients[ uuid ].reputation[ faction ] > lib.tables.factions.friend ){

							defense.current++

						}else if( sentients[ uuid ].reputation[ faction ] < lib.tables.factions.enemy ){

							enemies.current++

						}else{ // includes null rep

							traffic.current++

						}

					}

				}else{
					log('flag', '(no sentient)')
				}

			}

		}

		let need_defense = defense.capacity - defense.current
		let need_traffic = traffic.capacity - traffic.current
		let need_enemies = enemies.capacity - enemies.current

		log('system', 'npc.spawn: need defense, traffic, enemies: ', need_defense, need_traffic, need_enemies )

		// defense

		for( let i = 0; i < need_defense; i++ ){
			let new_uuid = uuid()
			let ship = new Ship({
				uuid: new_uuid,
				ref: {
					position: new Vector3( Math.random() * 100, Math.random() * 100, Math.random() * 100 )
					// {
						// x: Math.random() * 100,
						// y: Math.random() * 100,
						// z: Math.random() * 100
					// }
				}
			})
			let pilot = new Pilot({
				uuid: new_uuid,
				reputation: {
					[ faction ]: 150
				},
				waypoint: new Vector3( Math.random() * 500, Math.random() * 500, Math.random() * 500 )

			})

			system.register_entity('entropic', false, ship )
			system.register_entity('sentient', 'npc', pilot )
		}

		// misc

		for( let i = 0; i < need_traffic; i++ ){
			let new_uuid = uuid()
			let ship = new Freighter({
				uuid: new_uuid,
				ref: {
					position: new Vector3( Math.random() * 100, Math.random() * 100, Math.random() * 100 )
					// {
					// 	x: Math.random() * 100,
					// 	y: Math.random() * 100,
					// 	z: Math.random() * 100
					// }
				}
			})
				
			let pilot = new Pilot({
				uuid: new_uuid,
				reputation: {
					[ faction ]: 0
				},
				waypoint: new Vector3( Math.random() * 500, Math.random() * 500, Math.random() * 500 )
			})
			system.register_entity('entropic', false, ship )
			system.register_entity('sentient', 'npc', pilot )

		}

		// enemies

		for( let i = 0; i < need_enemies; i++ ){
			let new_uuid = uuid()
			let ship = new Ship({
				uuid: new_uuid,
				model_url: 'ships/fighter/spacefighter/spacefighter01.glb',
				ref: {
					position: new Vector3( Math.random() * 100, Math.random() * 100, Math.random() * 100 )
					// {
					// 	x: Math.random() * 100,
					// 	y: Math.random() * 100,
					// 	z: Math.random() * 100
					// }
				}
			})
			let pilot = new Pilot({
				uuid: new_uuid,
				reputation: {
					[ faction ]: -150
				},
				waypoint: new Vector3( Math.random() * -500, Math.random() * -500, Math.random() * -500 )
			})

			if( i === 0 ) ship.log = true

			system.register_entity('entropic', false, ship )
			system.register_entity('sentient', 'npc', pilot )
		}

	}, lib.tables.pulse.npc.spawn )

	/////////////////////////////////////////////////////////////////////////////////////////////// npc think

	// ----- thinking should be event based, not timer

	system.internal.pulses.npc.decide_move = setInterval(function(){

		// let drifted = 0

		// set ref.position, ref.momentum, ref.quaternion - these are DESIRED locations that will be lerped to client side
		for( const uuid of Object.keys( system.sentient.npc )){

			if( system.entropic[ uuid ] && system.entropic[ uuid ].type == 'ship' ){

				const move = system.sentient.npc[ uuid ].decide_move( system )

				switch( move.type ){

					case 'engage':

						log('flag', 'sentient engage: ', move.e_uuid )

						if( system.entropic[ uuid ].move_towards ){ // ships only
							system.entropic[ uuid ].move_towards( system.entropic[ move.e_uuid ].ref.position )
						}else{
							log('flag', 'non ship being asked to engage')
						}
						break;

					case 'waypoint':

						if( system.entropic[ uuid ].move_towards ){

							if( !system.sentient.npc[ uuid ].waypoint ) system.sentient.npc[ uuid ].waypoint = move.waypoint

							const runway = system.entropic[ uuid ].move_towards( move.waypoint )

							if( runway == 'arrived' ){
								log('npc_move', uuid.substr(0, 3), 'arrived')
								system.entropic[ uuid ].ref.momentum = new Vector3(0, 0, 0)
								system.entropic[ uuid ].ref.boosting = false
								delete system.sentient.npc[ uuid ].waypoint
							}

						}else{

							log('flag', 'non ship being asked to move: ', system.entropic[ uuid ].type, system.entropic[ uuid ].subtype )

						}
						break;

					case 'drift':
						// alright then
						// the rrrrreal physics
						// drifted = system.entropic[ uuid ].ref.momentum * lib.tables.pulse.npc.decide_move
						system.entropic[ uuid ].ref.position.add( system.entropic[ uuid ].ref.momentum )

						break;

					case 'station':

						// log('system', 'skipping station')

						break;

					default:

						break;

				}

			}
		}


		log('pulse', 'pulse npc think')

	}, lib.tables.pulse.npc.decide_move )

	/////////////////////////////////////////////////////////////////////////////////////////////// entropic spawn

	system.internal.pulses.entropic.spawn = setInterval(function(){

		// minerals, resources, etc

		log('pulse', 'pulse entropic spawn')

	}, lib.tables.pulse.entropic.spawn )

	/////////////////////////////////////////////////////////////////////////////////////////////// entropic broadcast move

	system.internal.pulses.entropic.move = setInterval(function(){

		const packet = {
			type: 'move',
			entropic: {}
		}

		for( const uuid of Object.keys( system.entropic ) ){

			if( !system.entropic[ uuid ].ref.model ) log('flag', 'missing: ', system.entropic[ uuid ] )

			// add pos to packet
			packet.entropic[ uuid ] = {
				mom: system.entropic[ uuid ].ref.momentum || new Vector3(), ///{ x: 0, y: 0, z: 0 },
				pos: system.entropic[ uuid ].ref.position || new Vector3(), //{ x: 0, y: 0, z: 0 },
				// quat: system.entropic[ uuid ].ref.quaternion || new Quaternion(), //{ x: 0, y: 0, z: 0, w: 0 },
				quat: system.entropic[ uuid ].ref.model.quaternion || new Quaternion(), //{ x: 0, y: 0, z: 0, w: 0 },
				boost: system.entropic[ uuid ].ref.boosting,
				waypoint: system.sentient.npc[ uuid ] ? system.sentient.npc[ uuid ].waypoint : false,
				pc: system.sentient.pc[ uuid ] ? true : false
			}

		}

		system.broadcast( false, packet )

		log('pulse', 'pulse entropic move')

	}, lib.tables.pulse.entropic.move )

	/////////////////////////////////////////////////////////////////////////////////////////////// entropic status

	system.internal.pulses.entropic.status = setInterval(function(){

		const packet = {
			type: 'status',
			entropic: {}
		}

		for( const uuid of Object.keys( system.entropic )){
			if( system.entropic[ uuid ].pulse_status ){
				packet.entropic[ uuid ] = system.entropic[ uuid ].publish()
				system.entropic[ uuid ].pulse_status = false
			}
		}

		if( Object.keys( packet.entropic ).length ){
			system.broadcast( false, packet )
		}

	}, lib.tables.pulse.entropic.status )

	/////////////////////////////////////////////////////////////////////////////////////////////// projectiles

	system.internal.pulses.misc.projectiles = setInterval(function(){

		const packet = {
			type: 'projectile',
			projectiles: {}
		}

		for( const uuid of Object.keys( system.projectiles )){

			// log('flag', 'init pos: ', system.projectiles[ uuid ].ref.position )

			system.projectiles[ uuid ].traject( system.entropic[ system.projectiles[ uuid ].target_uuid ] )

			packet.projectiles[ uuid ] = {
				owner_uuid: system.projectiles[ uuid ].owner_uuid,
				target_uuid: system.projectiles[ uuid ].target_uuid,
				origin: system.projectiles[ uuid ].ref.origin,
				subtype: system.projectiles[ uuid ].subtype,
				launched: system.projectiles[ uuid ].launched,
				target_dist: system.projectiles[ uuid ].target_dist,
				drifting: system.projectiles[ uuid ].drifting
				// position: system.projectiles[ uuid ].ref.position
				// lifetime: system.projectiles[ uuid ].lifetime,
				// sound: system.projectiles[ uuid ].sound
			}

			// packet.projectiles[ uuid ] = system.projectiles[ uuid ].publish() // - ONLY SHALLOW COPY - could be deleted in next step

			// log('flag', 'projectile pos; ', packet.projectiles[ uuid ].ref.position, system.projectiles[ uuid ].ref.position )

			if( system.projectiles[ uuid ].gc ) {
				log('flag', 'deleting projectile: ', uuid )
				delete system.projectiles[ uuid ]
			}

		}

		if( Object.keys( packet.projectiles ).length ){
			log('flag', 'projectiles packet: ', packet )
			system.broadcast( false, packet )
		}

	}, lib.tables.pulse.misc.projectiles )

	/////////////////////////////////////////////////////////////////////////////////////////////// end

	log('pulse', 'init_pulse: ', system.id )

}