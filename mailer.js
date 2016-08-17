var mailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var sparkPostTransport = require('nodemailer-sparkpost-transport');

var config = require('./config');

/*
// using API key
var options = {
	auth: {
		api_key: 'SENDGRID_APIKEY'
	}
}
-- or -- 
// using username + password
var options = {
	auth: {
		api_user: 'SENDGRID_USERNAME',
		api_key: 'SENDGRID_PASSWORD'
	}
}
*/

// var accountIndex = Math.floor( Math.random() * config.usedAccounts.length ),
// useAccount = config.usedAccounts[accountIndex];
// var options = {auth: useAccount};
module.exports = {
	sendGrid: function(index){
		var useAccount = config.usedAccounts[index];
		return mailer.createTransport(sgTransport({
			auth: useAccount
		}));
	},
	sparkPost: function(index){
		return mailer.createTransport(sparkPostTransport({
			sparkPostApiKey: config.sparkPostApiKey[index].key
		}));
	},
	/*
	provider
		1 => sendgrid
		2 => sparkpost
	*/
	send: function(provider, emailData, resultCallback){
		if( provider == 1 ){
			var index = Math.floor( Math.random() * config.usedAccounts.length );
			this.sendGrid(index).sendMail(emailData, function(err, result){
				resultCallback(err, result);
			});
		}else if( provider == 2 ){
			var sendingDomain = checkSendingDomain(emailData.from);
			
			if( sendingDomain === false ){
				resultCallback('Unconfigured Sending Domain!');
			}else{
				this.sparkPost(sendingDomain).sendMail(emailData, function(err, result){
					resultCallback(err, result);
				});
			}
		}
	}
}

function checkSendingDomain(from){
	var index,
	_from;
	console.log(typeof( from ) == 'object');
	if( typeof( from ) == 'object' ){
		_from = from.address;
	}else{ // type string
		_from = from;
	}
	console.log(_from);
	if( /my$/ig.test( _from ) ){ // jenjobs.my
		index = 1;
	}else if( /com$/ig.test( _from ) ){ // jenjobs.com
		index = 0;
	}else{
		index = false;
	}
	
	return index;
}