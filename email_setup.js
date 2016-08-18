var http = require('http');
var fs = require('fs');
var moment = require('moment');

var path = '/home/jenjobs/node/mailer/';

module.exports = {
	/*
	emailData: {
		to: ,
		title: ,
		text: ,
		html: ,
		template: 'jobseeker-application' | 'jobseeker-application-with-attachment' | 'forgot-password'
	}
	*/
	loadTemplate: function(emailData, resultCallback){
		fs.readFile(path+'layout.html', function(err, data){
			if( err ){
				resultCallback(err);
			}else{
				// {@YEAR} {@TITLE} {@CONTENT}
				var layoutContent = data.toString();
				layoutContent = layoutContent.replace( /\{\@YEAR\}/g, moment().format('YYYY') );
				layoutContent = layoutContent.replace( /\{\@TITLE\}/g, emailData.title );
				
				fs.readFile(path+emailData.template+'.html', function(err, data2){
					if( err ){
						resultCallback(err);
					}else{
						var templateContent = data2.toString();
						if( emailData.template == 'jobseeker-application' ){
							/*
							emailData: {
								title: xxx,
								template: xxx,
								
								name: xxx,
								position: xxx
							}
							*/
							
							templateContent = templateContent.replace( /\{\@JOBSEEKERNAME\}/g, emailData.name );
							templateContent = templateContent.replace( /\{\@POSITIONTITLE\}/g, emailData.position );
							templateContent = templateContent.replace( /\{\@TITLE\}/g, emailData.title );
							layoutContent = layoutContent.replace( /\{\@CONTENT\}/g, templateContent );
							resultCallback(null, layoutContent);
							
						}else if( emailData.template == 'jobseeker-application-with-attachment' ){
							/*
							emailData: {
								title: xxx,
								template: xxx,
								
								name: xxx,
								position: xxx,
								js_profile_id: xxx, 		----- additional field
								js_application_id: xxx 		----- additional field
							}
							*/
							templateContent = templateContent.replace( /\{\@JOBSEEKERNAME\}/g, emailData.name );
							templateContent = templateContent.replace( /\{\@POSITIONTITLE\}/g, emailData.position );
							templateContent = templateContent.replace( /\{\@TITLE\}/g, emailData.title );
							//////////////////// download attachment
							http.get('http://www.jenjobs.com/applicant/details?jsid='+emailData.js_profile_id+'&appid='+emailData.js_application_id, function(response){
								var chunks = [];
								response.on('data', function(chunk){
									chunks.push(chunk);
								}).on('end', function(){
									var resumeContent = Buffer.concat(chunks).toString();
									templateContent = templateContent.replace( /\{\@CONTENT\}/g, resumeContent );
									layoutContent = layoutContent.replace( /\{\@CONTENT\}/g, templateContent );
									resultCallback(null, layoutContent);
								});
							}).on('error', function(err){
								resultCallback(err);
							});
							////////////////////
							
						}else if( emailData.template == 'forgot-password' ){
							/*
							emailData: {
								title: xxx,
								template: xxx,
								
								url: xxx
							}
							*/
							templateContent = templateContent.replace( /\{\@REQUESTEDON\}/g, moment().format('DD MMM YYYY') );
							templateContent = templateContent.replace( /\{\@RESETURL\}/g, emailData.url );
							templateContent = templateContent.replace( /\{\@TITLE\}/g, emailData.title );
							layoutContent = layoutContent.replace( /\{\@CONTENT\}/g, templateContent );
							resultCallback(null, layoutContent);
						}else{
							resultCallback('Email template is required!');
						}
					}
				});
			}
		});
	}
};