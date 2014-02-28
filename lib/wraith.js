'use strict';

var fs = require('fs'),
	async = require('async'),
	mkdirp = require('mkdirp'),
	gallery = require('./gallery'),
	screenshot = require('./screenshot'),
	helpers = require('./helpers');

module.exports = wraith;

function wraith(config, engines, domains, sizes, domainLabels, outputFolder, cb) {

	var imageUrls = [],
		image = '',
		folder = '',
		dirs = [],
		urls;

	if( typeof config.paths !== 'undefined' && config.paths.length > 0 ) {
		urls = config.paths;
	} else {
		urls = fs.readFileSync(config.spider, 'utf8').split('\n');
	}

	if( urls.length > 0 ) {

		helpers.emptyFolder(outputFolder, function () {

			console.log('Cleaned up old folders and files');

			var foldersQueue = async.queue(function(folder, callback) {
				mkdirp(folder, function (err) {
					if (err) { throw err; }
					callback();
				});
			});

			for(var url in urls) {
				folder = outputFolder + urls[url].substring(1).replace(/\/+$/,'') + '/';
				foldersQueue.push(folder);
				dirs.push(folder);
			}

			foldersQueue.drain = function() {
				console.log('New folders created');

				var screenshotQueue = async.queue(function (task, callback) {
					screenshot.take(task.engine, task.snapFile, task.url, task.size, task.output, callback);
				}, config.maxConnections);

				var url, size;

				if( engines.length === 1 ) {
					for(var domain in domains) {
						for(url in urls) {
							imageUrls.push(domains[domain] + urls[url]);
							folder = outputFolder + urls[url].substring(1).replace(/\/+$/,'') + '/';
							for(size in sizes) {
								image = folder + domainLabels[domain] + '_' + sizes[size] + '.png';
								screenshotQueue.push({
									engine: engines[0],
									snapFile: config.snap,
									url: domains[domain] + urls[url],
									size: sizes[size],
									output: image
								});
							}
						}
					}
				} else {
					for(url in urls) {
						for(var engine in engines) {
							imageUrls.push(domains[0] + urls[url]);
							folder = outputFolder + urls[url].substring(1).replace(/\/+$/,'') + '/';
							for(size in sizes) {
								image = folder + engines[engine] + '_' + sizes[size] + '.png';
								screenshotQueue.push({
									engine: engines[engine],
									snapFile: config.snap,
									url: domains[0] + urls[url],
									size: sizes[size],
									output: image
								});
							}
						}
					}
				}

				screenshotQueue.drain = function() {
					console.log('Screenshots done');

					var compareQueue = async.queue(function(task, callback) {
						screenshot.compare(task.base, task.compare, task.output, task.diff, task.fuzz, callback);
					}, config.maxConnections);

					folder = '';
					var fileLabels = [], compareList = [], item;

					if( engines.length === 1 ) {
						fileLabels = [domainLabels[0], domainLabels[1]];
					} else {
						fileLabels = [engines[0], engines[1]];
					}

					for(var url in urls) {
						var dir = urls[url].substring(1).replace(/\/+$/,'') + '/';
						folder = outputFolder + dir;
						for(var size in sizes) {
							item = {
								'dir': ( size > 0 ? false : folder),
								'sort': folder + size,
								'base': folder + fileLabels[0]  + '_' + sizes[size] + '.png',
								'compare': folder + fileLabels[1] + '_' + sizes[size] + '.png',
								'output': folder + sizes[size] + '_diff.png',
								'diff': folder +  sizes[size] + '_diff.txt',
								'fuzz': config.fuzz,
								'size': sizes[size]
							};
							compareQueue.push(item);
							compareList.push(item);
						}
					}

					compareQueue.drain = function(){
						console.log('Image comparison done');
						gallery.generate(dirs, compareList, outputFolder, config.project, cb);
					};
				};
			};
		});
	} else {
		console.log('No url(s) provided');
		return false;
	}
}