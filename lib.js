const validator = require('email-validator')
const p_validator = require('password-validator')

const { Object3D, Vector3 } = require('three')

const schema = new p_validator()
const name_schema = new p_validator()


const log = require('./log.js')

log('call', 'lib.js')

 
// Add properties to it
schema
	.is().min(6)                                    // Minimum length 8
	.is().max(30)                                   // Maximum length 100
	// .has().uppercase()                           // Must have uppercase letters
	// .has().lowercase()                           // Must have lowercase letters
	// .has().digits()                              // Must have digits
	.has().not().spaces()                           // Should not have spaces
	.is().not().oneOf(['password', 'Passw0rd', 'Password123'])


name_schema
	.is().min(3)
	.is().max(25)
	.has().not().spaces()
	.has().not().digits()


Object3D.prototype.lookAwayFrom = function( target ){
	const v = new Vector3()
    v.subVectors( this.position, target.position ).add( this.position )
    source.lookAt( v )
}


const lib = {

	tables: {

		bingbang_interval: 30000,

		timeout: 30000, 

		factions: {
			friend: 100,
			enemy: -100
		},

		accounts:{
			pilot: [1, 2, 3]
		},

		names: {
			pilots:{
				fname: ['Otker','Ansovald','Bosco','Thierry','Fastolph','Grimald','Meginhurd','Erenfried','Tolman','Flodoard','Mentha','Calamity','Melba','Adaltrude','Liutgarde','Lanthechilde','Chunsina','Brianna','Tara','Tasha','Garivald','Lothar','Brutus','Giseler','Isengrim','Iago','Filibert','Theodebert','Tassilo','Amand','Bertha','Ruby','Theudechild','Alexsta','Brunhilda','Ellinrat','Fiona','Ruothilde','Erica','Theodelinda'],
				lname: ['Boulderhill','Longfoot','Greenhand','Puddlefoot','Longriver','Goodsong','Fleetfoot','Noakesburrow','Lothran','Hornwood','Cotton','Wanderfoot','Brown','Lightfoot','Langham','Townsend','Twofoot','Took-Brandybuck','Oldbuck','Rumble','Gluttonbelly','Brandagamba','Riverhopper','Took-Took','Boffin','Bramblethorn','Silverstring','Gardner','Featherbottom','Proudbottom','Boffin','Bophin','Greenhill','Noakesburrow','Bolger','Sandyman','Gamwich','Longriver','Goldworthy','Swiftfoot']
			},
			ships: ['Clipper', 'Bertha', 'Tequila Sunrise', 'Margaritaville', 'Star Hopper', 'Void Crosser']
		},

		position: {
			station: {
				base: new Vector3( Math.random() * 10000, Math.random() * 10000, Math.random() * 10000 ),
				primary: new Vector3( 250, 0, 0 ),
				mining: new Vector3( -500, 0, 0 ),
				docking: new Vector3( 0, 0, 99000 )
			},
		},
		minimum_station_dist: 1000,

		momentum: {
			ship: new Vector3( 0, 0, .1 ),
			entropic: new Vector3( 0, 0, .1 )
		},

		verboten: ['fuck', 'shit', 'cunt', 'damn', 'nigger', 'kike', 'chink', 'bitch'],

		cooldown: {

			cannon: 1000

		},

		pulse: {
			npc: {
				spawn: 10000,
				decide_move: 1000
			},
			entropic: {
				spawn: 9000,
				move: 2000,
				status: 2000
			},
			misc: {
				projectiles: 900
			}
		}

	},

	ORIGIN: new Vector3(0, 0, 0),

	json_hydrate: function( data ){

		if( typeof( data ) == 'string' ){
			let r = {}
			try{
				r = JSON.parse( data )
			}catch( e ){
				log('flag', 'invalid json parse: ', data )
			}

			return r

		}else if( typeof( data ) === 'object' ){

			return data
			
		}

		return false

	},

	get_public: function(){

		const r = {}

		Object.keys( this ).forEach( key => {
			if( !key.match(/^_/) && key != 'get_public' ){
				r[key] = this[key]
			}
		})

		return r

	},

	iso_to_ms( iso ){

		let isoTest = new RegExp( /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/ )

	    if( isoTest.test( str ) ){
	    	return new Date( iso ).getTime()
	    }
	    return false 

	},

	ms_to_iso( ms ){

		if( typeof( ms ) !=  'number' )  return false

		return new Date( ms ).toISOString()

	},

	random_hex: random_hex,

	random_int: function( start, range ){

		return start + Math.floor( Math.random() * range )

	},

	is_uuid: function( data ){

		if( typeof( data === 'string' ) && data.length > 10 ) return true
		return false

	},

	// is_ecc_id: function( id ){

	// 	// log('flag', 'should')
	// 	// return false

	// 	// if ( id.match(/^[0-9a-fA-F]{24}$/) ) return true
	// 	if ( id.match(/^\_[0-9a-zA-Z]{3}\_.*/) ) return true
	// 	return false

	// },

	unique_id: function( type, group ){

		let id = false

		while( !id ){
			id = this.attempt_unique( type, group )
		}

		return id

	},

	attempt_unique: function( type, group ){

		let new_id = lib.random_hex(10)
		// let group = {}

		switch( type ){
		case 'entropic':
			new_id = '_ent_' + new_id
			break
		case 'sentient':
			new_id = '_sen_' + new_id
			break
			// case 'system':
			// 	new_id = '_sys_' + new_id
			// 	break;
		case 'sockets':
			new_id = '_sck_' + new_id
			break
		case 'user': 
			new_id = '_tmp_' + new_id
			break
		default: 
			new_id = 'invalid'
			break
		}

		for( const id of Object.keys( group ) ){
			if( group[ id ] && group[ id ].id == new_id ) return false
		}

		return new_id

	},

	is_valid_email: function( email ){

		return validator.validate( email )

	},

	is_valid_password: function( password ){

		return schema.validate( password + '' )

	},

	is_valid_name: function( name ){

		return name_schema.validate( name + '' )

	},

	stringify_date: function( type, date ){

		if( type == 'days' ){
			return String( date.getYear() ) + String( date.getMonth() ) + String( date.getDate() )
		}
		return false
	},

	is_valid_pilot_name: function( data ){
		let msg = 'fine'
		if( typeof( data ) != 'string' ) msg = 'invalid data'
		if( data.length > 25 ) msg += ', too long'
		if( data.match(/ /g).length > 1 ) msg += ', too many spaces'
		return msg
	},

	// merge_array: function( arr_old, arr_new ){

	// 	let overlap = []
	// 	for( let i = 0; i < arr_old.length; i++ ){
	// 		if( arr_new.includes( arr_old[i] ) ){
	// 			if( !overlap.includes( arr_old[i] ) ){
	// 				overlap.push( arr_old[i] )
	// 			}
	// 		}
	// 	}

	// 	for( let i =0; i < overlap.length; i++ ){
	// 		let oo = arr_old.indexOf( overlap[i] )
	// 		let io = arr_new.indexOf( overlap[i] )
	// 		// if( io != oo ){
	
	// 		// }
	// 	}

	// 	// let r_array
	// 	// or return arr_old .. ?
	// 	return arr_new
	// },

	sanitize_packet: function( packet ){

		return packet

	},

	steps_to_zero( step, current ){

		if( current <= 0 || step <= 0 ) return false

		let mirror = current
		let interval = 0
		let steps = 0
		// let total = 
		// for( let i = 0; i < dest; i++){
		while( mirror > 0 ){

			interval += step
			mirror -= interval
			steps++

		}

		return steps

	},

	getBaseLog: function(x, y) {

		return Math.log(y) / Math.log(x)

	},

	sanitize_chat: sanitize_chat,

	// THREE: {

	// 	distanceTo: distanceTo,

	// 	distanceToSquared: distanceToSquared,

	// 	lookAwayFrom: function( source, target ){
	// 	    const v = new Vector3()
	// 	    v.subVectors( source.position, target.position ).add( source.position )
	// 	    source.lookAt( v )
	// 	}

	// }

}



function sanitize_chat( chat ){

	if( typeof( chat ) === 'string' ){
		chat = chat.substr( 0, 240 )
		for( const v of lib.tables.verboten ){
			let r = new RegExp( v, 'g')
			chat = chat.replace(r, '---')
		}
		return chat
	}
	return false

}


function random_hex( len ){

	//	let r = '#' + Math.floor( Math.random() * 16777215 ).toString(16)
	let s = ''
	
	for( let i = 0; i < len; i++){
		
		s += Math.floor( Math.random() * 16 ).toString( 16 )

	}
	
	return s

}





// function distanceTo( v1, v2 ) {

// 	return Math.sqrt( distanceToSquared( v1, v2 ) )

// }

// function distanceToSquared( v1, v2 ) {

// 	var dx = v1.x - v2.x, 
// 		dy = v1.y - v2.y, 
// 		dz = v1.z - v2.z

// 	return dx * dx + dy * dy + dz * dz

// }




module.exports = lib
