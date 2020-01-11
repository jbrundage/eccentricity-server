
const log = require('../../log.js')

const lib = require('../../lib.js')

const GALAXY = require('../../single/Galaxy.js')()

log('call', 'Ephemera.js')


class Ephemera{

	constructor( init ){

		init = init || {}

		this.sys_id = init.sys_id

		this.id = init.id //|| lib.unique_id( 'entity', ( GALAXY.systems[ this.sys_id ] ? ( GALAXY.systems[ this.sys_id ].entities || {} ) : {} ) )

		this.entropy = 'positive'

		this.name = init.name

		this.model_url = init.model_url

		this.width = init.width || 25
		this.height = init.height || 25

		// status
		// init.ref = init.ref || {}
		this.ref = init.ref || {
			position: {
				x: lib.tables.position.station.primary.x, // + 500,
				y: lib.tables.position.station.primary.y + 250,
				z: lib.tables.position.station.primary.z - 1000,
			},
			momentum: { x: 0, y: 0, z: 0 },
			quaternion: { x: 0, y: 0, z: 0, w: 0 }
		}

		this.speed_limit = init.speed_limit || 5

		this.private = ['private', 'id', 'clickable', 'desired_pos', 'inertia_pos', 'previous', 'model', 'model_url', 'entropy', 'ref']
		// this.speed = init.speed || 0

	}


}

module.exports = Ephemera