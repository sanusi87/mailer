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
			emailSetup.loadTemplate({
				title: requestBody.title,
				template: requestBody.template,
				name: requestBody.name,
				position: requestBody.position
			}, function(err, htmlData){
				var emailData = {
					to: requestBody.to,
					// from: {
					// 	name: requestBody.title,
					// 	address:'do-not-reply@jenjobs.com'
					// },
					from: 'do-not-reply@jenjobs.com',
					subject: requestBody.title
				};
				
				if( requestBody.cc ){
					emailData.cc = requestBody.cc;
				}
				emailData.html = htmlData;
				
				mailer.send(2, emailData, function(err, result){
					console.log(err, result);
				});
			});
		}
		//////////////////
	});
});

server.listen(listeningPort, '0.0.0.0', function(){
	console.log('Server started, listening on port: '+listeningPort);
});