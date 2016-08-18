var http = require('http'),
fs = require('fs'),
emailSetup = require('./email_setup'),
mailer = require('./mailer'),
config = require('./config');

const listeningPort = 4000;

var server = http.createServer(function(req,res){
	res.setHeader('Content-Type', 'text/html');
	res.setHeader('X-Foo', 'bar');
	res.writeHead(200, {'Content-Type': 'text/plain'});
	
	// handle request sent
	var chunksOfData = [];
	req.on('data', function(chunk){
		chunksOfData.push(chunk);
	}).on('end', function(){
		res.end('ok'); // just return anything
		var requestBody = JSON.parse((Buffer.concat(chunksOfData)).toString());
		console.log('requestBody: ', requestBody);
		
		//////////////////
		/*
		template: 
		title: 
		to: xxx@email.com,
		cc: [xxx@xxx.xxx, yyy@yyy.yyy]
		
		position: 
		name: 
		*/
		if( requestBody != null && requestBody != "" ){
			var emailData = {
				to: requestBody.to,
				// from: {
				// 	name: requestBody.title,
				// 	address:'do-not-reply@jenjobs.com'
				// },
				from: '"JenJOBS Customer Service" <do-not-reply@jenjobs.com>',
				subject: requestBody.title
			};
			
			// jobseeker application
			if( requestBody.cc ){
				emailData.cc = requestBody.cc;
			}
			
			if( typeof( requestBody.from ) != 'undefined' ){
				emailData.from = requestBody.from;
			}
			
			// generate email body content based on template
			emailSetup.loadTemplate(requestBody, function(err, htmlData){
				if( err ){
					console.log(err);
				}else{
					emailData.html = htmlData;
					if( requestBody.template == 'jobseeker-application' 
					|| requestBody.template == 'jobseeker-application-with-attachment'
					|| requestBody.template == 'forgot-password'){
						if( requestBody.template == 'jobseeker-application' 
							|| requestBody.template == 'jobseeker-application-with-attachment' ){
							
							if( typeof( emailData.from ) == 'object' ){
								emailData.from.address = '"JenJOBS.com - Application Received" <do-not-reply@jenjobs.net>';
							}else{
								emailData.from = '"JenJOBS.com - Application Received" <do-not-reply@jenjobs.net>';
							}
						}
						
						mailer.send(1, emailData, function(err, result){
							console.log(err, result);
						});
					}else{
						mailer.send(2, emailData, function(err, result){
							console.log(err, result);
						});
					}
				}
			});
		}
		//////////////////
	});
});

server.listen(listeningPort, '0.0.0.0', function(){
	console.log('Server started, listening on port: '+listeningPort);
});