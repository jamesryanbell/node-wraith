'use strict';

var fs     = require('fs'),
	mkdirp = require('mkdirp'),
	crawl  = require('crawl');

module.exports = spider;

function spider(url, file, callback) {

	console.log('Crawl of ' + url + ' started');

	crawl.crawl(url, { headers: false, body: false }, function(err, pages) {

		if (err) {
			console.error('An error occured', err);
			return;
		}

		var txt = '',
			pagesLength = pages.length,
			link = '';

		for(var i = 0; i<pagesLength; i++) {
			link = pages[i].url;
			var excPattern = new RegExp('.(css|js|jpg|jpeg|png|pdf|doc|xls|xlsx|ppt|txt|gif|swf|svg|ttf|otf|woff|json|xml)+$');
			if(link.indexOf(url) === 0 && !link.match(excPattern)) {
				txt += link.replace(url, '') + '\n';
			}
		}
		txt = txt.trim();

		if( txt.length > 0 ) {

			var folders = file.split('/');
			folders.pop();
			folders = folders.join('/');

			mkdirp(folders, function (err) {
				if (err) { throw err; }
				fs.writeFile(file, txt, function(err) {
					if(err) {
						console.log(err);
					} else {
						console.log('Spider file saved to ' + file);
						callback();
					}
				});
			});
		} else {
			console.log('No urls found');
		}
	});
}