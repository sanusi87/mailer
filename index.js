var http = require('http'),
fs = require('fs'),
moment = require('moment'),
mailer = require('./mailer');

const listeningPort = 4000;

var root = '/home/jenjobs/node/mailer/';

/*
// generate random number
var x = Math.random() * 10 + 1;
console.log(x);
console.log(Math.floor(x));
*/

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
		
		// 1 - js_profile_id/jsid + js_application_id/appid + to[email] + cc[email]* + attachment are sent
		// 2 - we get the html content from http://www.jenjobs.com/applicant/details?jsid=___&appid=___
		// 3 - we merge the content[2] with the email template to form a complete email
		if( requestBody != null && requestBody != "" ){
			var jsid = requestBody.js_profile_id,
			jsname = requestBody.name,
			position = requestBody.position,
			appid = requestBody.js_application_id,
			toEmail = requestBody.to,
			toCC = requestBody.cc, // array
			attachment = requestBody.attachment, // 0=false/1=true
			title = 'Application Received From '+jsname+' For '+position;
			
			var emailData = {
				to: toEmail,
				from: {
					name: 'JenJOBS.com - Application Received',
					address:'do-not-reply@jenjobs.net'
				},
				subject: title
			};
			
			if( toCC ){
				emailData.cc = toCC;
			}
			
			fs.appendFile(root+'log.txt', 'Sending email to '+toEmail+'['+jsid+'-'+appid+']...\n', function(err){
				console.log('appendFile', err);
			});
			
			// read the template
			fs.readFile(root+'layout.html', function(err, data){
				if( err ){
					console.log('readFile', err);
				}else{
					// {@YEAR} {@TITLE} {@CONTENT}
					var layoutContent = data.toString();
					layoutContent = layoutContent.replace( /\{\@YEAR\}/g, moment().format('YYYY') );
					layoutContent = layoutContent.replace( /\{\@TITLE\}/g, title );
					
					// if attachment is requested
					if( attachment ){
						// wrapper for resume+attachment
						// {@JOBSEEKERNAME} {@CONTENT} {@POSITIONTITLE}
						fs.readFile(root+'jobseeker-application-with-attachment.html', function(err, data){
							if( err ){
								console.log('readFile1', err);
							}else{
								var wrapperContent = data.toString();
								wrapperContent = wrapperContent.replace( /\{\@JOBSEEKERNAME\}/g, jsname );
								wrapperContent = wrapperContent.replace( /\{\@POSITIONTITLE\}/g, position );
								wrapperContent = wrapperContent.replace( /\{\@TITLE\}/g, title );
								
								// download resume content
								console.log('downloading attachment...', 'http://www.jenjobs.com/applicant/details?jsid='+jsid+'&appid='+appid);
								http.get('http://www.jenjobs.com/applicant/details?jsid='+jsid+'&appid='+appid, function(response){
									var chunks = [];
									response.on('data', function(chunk){
										chunks.push(chunk);
									}).on('end', function(){
										var resumeContent = Buffer.concat(chunks).toString();
										console.log('done.');
										
										wrapperContent = wrapperContent.replace( /\{\@CONTENT\}/g, resumeContent );
										layoutContent = layoutContent.replace( /\{\@CONTENT\}/g, wrapperContent );
										
										// ----
										emailData.html = layoutContent;
										startSendMail(emailData, function(err, result){
											console.log('sent?', err, result);
										});
										// ----
										
									});
								}).on('error', function(err){
									console.log('http error', err);
								});
							}
						}); // end read template
					}else{
						fs.readFile(root+'jobseeker-application.html', function(err, data){
							if( err ){
								console.log('readFile2', err);
							}else{
								var wrapperContent = data.toString();
								wrapperContent = wrapperContent.replace( /\{\@JOBSEEKERNAME\}/g, jsname );
								wrapperContent = wrapperContent.replace( /\{\@POSITIONTITLE\}/g, position );
								wrapperContent = wrapperContent.replace( /\{\@TITLE\}/g, title );
								layoutContent = layoutContent.replace( /\{\@CONTENT\}/g, wrapperContent );
								
								// ----
								emailData.html = layoutContent;
								startSendMail(emailData, function(err, result){
									console.log('sent?', err, result);
								});
								// ----
							}
						});
					}
				}
			});
		}
	});
		
});

server.listen(listeningPort, '0.0.0.0', function(){
	console.log('Server started, listening on port: '+listeningPort);
});


function startSendMail(data, cb){
	mailer.sendMail(data, function(err, result) {
		if (err) { 
			console.log('mailer error');
			// console.log(err);
			fs.appendFileSync(root+'log.txt', JSON.stringify(err)+'\n');
			cb(err);
		}else{
			// console.log(result);
			fs.appendFileSync(root+'log.txt', JSON.stringify(result)+'\n');
			cb(null, result);
		}
	});
}