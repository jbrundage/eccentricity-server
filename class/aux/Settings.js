
const log = require('../../log.js')

log('call', 'Settings.js')

class Settings {

	constructor( init ){

		init = init || {}

		this.movement = init.movement || {
			look_speed: .002
		}

		this.camera_vertical_offset = init.camera_vertical_offset || 10

		this.camera_horizontal_offset = init.camera_horizontal_offset || 80

		this.bindings = init.bindings || {}

		this.FRAMERATE = init.FRAMERATE || 15

		this.RESOLUTION = init.RESOLUTION || 1

	}

}

  
module.exports = Settings