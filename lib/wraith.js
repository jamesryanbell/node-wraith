'use strict';

var fs         = require('fs'),
	async      = require('async'),
	mkdirp     = require('mkdirp'),
	gallery    = require('./gallery'),
	screenshot = require('./screenshot'),
	path       = require('path'),
	helpers    = require('./helpers');

module.exports = wraith;

function wraith(config, cb) {

	console.log(config);
	var imageUrls      = [],
		image          = '',
		folder         = '',
		dirs           = [],
		urls           = [],
		domains        = [],
		outputFolder   = config.outputDir,
		domainLabels   = [];

	var outputFolder   = config.outputDir || "shots/";
	var engines        = config.engines || ["phantomjs"];
	var sizes          = config.sizes || ["320", "480", "660", "768", "960", "1024", "1280", "1440"];
	var	fuzz           = config.fuzz || "20%";
	var snap  		   = config.snap || path.join(__dirname, '/../snap.js');
	var maxConnections = config.maxConnections || 20;

	for(var domain in config.domains) {
		domains.push(config.domains[domain].replace(/\/+$/, ''));
		domainLabels.push(domain);
	}

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
				folder = path.join(outputFolder, urls[url].substring(1).replace(/\/+$/,'') + '/');
				foldersQueue.push(folder);
				dirs.push(folder);
			}

			foldersQueue.drain = function() {
				console.log('New folders created');

				var screenshotQueue = async.queue(function (task, callback) {
					screenshot.take(task.engine, task.snapFile, task.url, task.size, task.output, callback);
				}, maxConnections);

				var url, size;

				if( engines.length === 1 ) {
					for(var domain in domains) {
						for(url in urls) {
							imageUrls.push(domains[domain] + urls[url]);
							folder = path.join(outputFolder, urls[url].substring(1).replace(/\/+$/,'') + '/');

							for(size in sizes) {
								image = folder + domainLabels[domain] + '_' + sizes[size] + '.png';
								screenshotQueue.push({
									engine: engines[0],
									snapFile: snap,
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
							folder = path.join(outputFolder, urls[url].substring(1).replace(/\/+$/,'') + '/');
							for(size in sizes) {
								image = folder + engines[engine] + '_' + sizes[size] + '.png';
								screenshotQueue.push({
									engine: engines[engine],
									snapFile: snap,
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
					}, maxConnections);

					folder = '';
					var fileLabels = [], compareList = [], item;

					if( engines.length === 1 ) {
						fileLabels = [domainLabels[0], domainLabels[1]];
					} else {
						fileLabels = [engines[0], engines[1]];
					}

					for(var url in urls) {
						var dir = urls[url].substring(1).replace(/\/+$/,'') + '/';
						folder = path.join(outputFolder, dir);;
						for(var size in sizes) {
							item = {
								'dir': ( size > 0 ? false : folder),
								'sort': folder + size,
								'base': folder + fileLabels[0]  + '_' + sizes[size] + '.png',
								'compare': folder + fileLabels[1] + '_' + sizes[size] + '.png',
								'output': folder + sizes[size] + '_diff.png',
								'diff': folder +  sizes[size] + '_diff.txt',
								'fuzz': fuzz,
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