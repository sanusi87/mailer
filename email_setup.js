var http = require('http');
var fs = require('fs');
var moment = require('moment');

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
		fs.readFile('layout.html', function(err, data){
			if( err ){
				resultCallback(err);
			}else{
				// {@YEAR} {@TITLE} {@CONTENT}
				var layoutContent = data.toString();
				layoutContent = layoutContent.replace( /\{\@YEAR\}/g, moment().format('YYYY') );
				layoutContent = layoutContent.replace( /\{\@TITLE\}/g, emailData.title );
				
				fs.readFile(emailData.template+'.html', function(err, data2){
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
								jsid: xxx,
								appid: xxx
							}
							*/
							templateContent = templateContent.replace( /\{\@JOBSEEKERNAME\}/g, emailData.name );
							templateContent = templateContent.replace( /\{\@POSITIONTITLE\}/g, emailData.position );
							templateContent = templateContent.replace( /\{\@TITLE\}/g, emailData.title );
							//////////////////// download attachment
							http.get('http://www.jenjobs.com/applicant/details?jsid='+emailData.jsid+'&appid='+emailData.appid, function(response){
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
							layoutContent = layoutContent.replace( /\{\@CONTENT\}/g, templateContent );
							resultCallback(null, layoutContent);
						}
					}
				});
			}
		});
	}
};