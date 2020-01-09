const validator = require('email-validator')
const p_validator = require('password-validator')

const schema = new p_validator();
const log = require('./log.js');

log('call', 'lib.js')

 
// Add properties to it
schema
.is().min(6)                                    // Minimum length 8
.is().max(30)                                   // Maximum length 100
// .has().uppercase()                           // Must have uppercase letters
// .has().lowercase()                           // Must have lowercase letters
// .has().digits()                              // Must have digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['password', 'Passw0rd', 'Password123']);

const lib = {

	tables: {
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
				primary: { x: 500, y: 0, z: 0 },
				mining: { x: -500, y: 0, z: 0 },
				docking: { x: 0, y: 0, z: 99000 }
			}
		},
		minimum_station_dist: 1000,
		momentum: {
			ship: { x: 0, y: 0, z: .1 }
		},
		verboten: ['fuck', 'shit', 'cunt', 'damn', 'nigger', 'kike', 'chink', 'bitch']

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

	random_hex: random_hex,

	is_ecc_id: function( id ){

		if ( id.match(/^[0-9a-fA-F]{24}$/) ) return true
		if ( id.match(/^\_[0-9a-zA-Z]{3}\_/) ) return true
		return false

	},

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
			case 'entity':
				new_id = '_ent_' + new_id
				break;
			case 'sentient':
				new_id = '_sen_' + new_id
				break;
			case 'user': 
				new_id = '_tmp_' + new_id
				break;
			default: 
				new_id = 'invalid'
				break;
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

		if( !schema.validate( password + '' ) ) return false
		return true

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

	merge_array: function( arr_old, arr_new ){

		let overlap = []
		for( let i = 0; i < arr_old.length; i++ ){
			if( arr_new.includes( arr_old[i] ) ){
				if( !overlap.includes( arr_old[i] ) ){
					overlap.push( arr_old[i] )
				}
			}
		}

		for( let i =0; i < overlap.length; i++ ){
			let oo = arr_old.indexOf( overlap[i] )
			let io = arr_new.indexOf( overlap[i] )
			if( io != oo ){
	
			}
		}

		let r_array
		// or return arr_old .. ?
		return arr_new
	},

	sanitize_packet: function( packet ){

		return packet

	},

	sanitize_chat: sanitize_chat,

	THREE: {

		distanceTo: distanceTo,

		distanceToSquared: distanceToSquared

	}

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





function distanceTo( v1, v2 ) {

	return Math.sqrt( distanceToSquared( v1, v2 ) )

}

function distanceToSquared( v1, v2 ) {

	var dx = v1.x - v2.x, 
	dy = v1.y - v2.y, 
	dz = v1.z - v2.z

	return dx * dx + dy * dy + dz * dz;

}




module.exports = lib
