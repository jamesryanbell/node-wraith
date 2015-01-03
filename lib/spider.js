'use strict';

var fs     = require('fs');
var mkdirp = require('mkdirp');
var crawl  = require('crawl');
var log    = require('./logger');

module.exports.spider = function(url, file, callback) {

	log.log('Crawl of ' + url + ' started');

	crawl.crawl(url, { headers: false, body: false }, function(err, pages) {

		if (err) {
			log.error('An error occured', err);
			return;
		}

		var txt         = '';
		var link        = '';
		var pagesLength = pages.length;

		for(var i = 0; i<pagesLength; i++) {
			link = pages[i].url;
			var excPattern = new RegExp('.(css|js|jpg|jpeg|png|pdf|doc|xls|xlsx|ppt|txt|gif|swf|svg|ttf|otf|woff|json|xml)+$');
			if(link.indexOf(url) === 0 && !link.match(excPattern)) {
				txt += link.replace(url, '') + '\n';
			}
		}

		txt = txt.trim();

		if(txt.length > 0) {
			var folders = file.split('/');
			folders.pop();
			folders = folders.join('/');

			mkdirp(folders, function (err) {
				if (err) { throw err; }
				fs.writeFile(file, txt, function(err) {
					if(err) {
						log.error(err);
					} else {
						log.log('Spider file saved to ' + file);
						callback();
					}
				});
			});
		} else {
			log.error('No urls found');
			process.exit(1);
		}
	});
};
