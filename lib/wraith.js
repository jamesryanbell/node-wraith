'use strict';

var fs        = require('fs');
var async     = require('async');
var mkdirp    = require('mkdirp');
var path      = require('path');
var resemble  = require('node-resemble-js');
var progress  = require('progress');
var gallery   = require('./gallery');
var helpers   = require('./helpers');
var log       = require('./logger');
var phantomjs = require('phantomjs2');

function Wraith(config, cb) {
	var self  = this;
	self.cb   = cb;
	log.quiet = config.quiet;

	if(config.paths && config.paths.length > 0) {
		self.config(config);
	} else if(config.spider && config.spider !== '') {
		if(!fs.existsSync(config.spider)) {
			var spider = require('./spider');

			spider.spider(config.domains[0], config.spider, function() {
				self.config(config);
			});
		} else {
			self.config(config);
		}
	} else {
		log.error('You must specify either a list of pages or a location to store the spider file');
		process.exit(1);
		return false;
	}
	return true;
}

module.exports = Wraith;

Wraith.prototype.config = function(config) {

	var self = this;

	self.domains        = [];
	self.domainLabels   = [];
	self.outputFolder   = config.outputDir || 'shots/';
	self.engines        = config.engines || ['phantomjs'];
	self.maxConnections = config.maxConnections || 20;
	self.project        = config.project || '';
	self.sizes          = [];
	self.dirs           = [];
	self.quiet          = config.quiet || false;

	if(typeof config.paths !== 'undefined' && config.paths.length > 0 ) {
		self.urls = config.paths;
	} else {
		self.urls = fs.readFileSync(config.spider, 'utf8').split('\n');
	}

	for(var domain in config.domains) {
		self.domains.push(config.domains[domain].replace(/\/+$/, ''));
		self.domainLabels.push(config.domains[domain].replace(/.*?:\/\//g, ''));
	}

	if(self.urls.length === 0 || self.domains.length === 0) {
		log.error('No url(s) provided');
		process.exit(1);
		return false;
	}

	for(var url in self.urls) {
		var folder = path.join(self.outputFolder, self.urls[url].substring(1).replace(/\/+$/,'') + '/');
		self.dirs.push(folder);
	}

	if( config.sizes && config.sizes.length > 0 ) {
		self.sizes = config.sizes;
		self.clean();
		return self;
	} else {
		log.info('No sizes defined, using most popular from w3counter stats');
		var w3counter = require('w3counter');
		w3counter('res', function (err, data) {
			if (err) { throw err; }
			for(var val in data) {
				var size = data[val].item.slice(0, data[val].item.indexOf('x'));
				self.sizes.push(size);
			}
			self.clean();
			return self;
		});
	}
};

Wraith.prototype.clean = function() {
	var self = this;
	log.info('Cleaned up old folders and files');

	helpers.emptyFolder(self.outputFolder, function () {
		self.createFolders();
		return self;
	});
};

Wraith.prototype.createFolders = function() {
	var self = this;

	async.each(self.dirs, function(folder, callback) {
		mkdirp(folder, function (err) {
			if (err) { throw err; }
			callback();
		});
	}, function(err) {
		if( err ) {
			log.error('An error occurred during folder creation');
			process.exit(1);
			return self;
		} else {
			log.success('New folders created successfully');
			self.takeScreenshots();
			return self;
		}
	});
};

Wraith.prototype.takeScreenshots = function () {
	var self            = this;
	var url             = null;
	var imageUrls       = [];
	var screenshotQueue = [];
	var size            = null;
	var image           = null;
	var folder          = null;

	if( self.engines.length === 1 ) {
		for(var domain in self.domains) {
			for(url in self.urls) {
				imageUrls.push(self.domains[domain] + self.urls[url]);
				self.folder = path.join(self.outputFolder, self.urls[url].substring(1).replace(/\/+$/,'') + '/');
				for(size in self.sizes) {
					image = self.folder + self.domainLabels[domain] + '_' + self.sizes[size] + '.png';
					screenshotQueue.push({
						engine: self.engines[0],
						url: self.domains[domain] + self.urls[url],
						size: self.sizes[size],
						output: image
					});
				}
			}
		}
	} else {
		for(url in self.urls) {
			for(var engine in self.engines) {
				imageUrls.push(self.domains[0] + self.urls[url]);
				folder = path.join(self.outputFolder, self.urls[url].substring(1).replace(/\/+$/,'') + '/');
				for(size in self.sizes) {
					image = folder + self.engines[engine] + '_' + self.sizes[size] + '.png';
					screenshotQueue.push({
						engine: self.engines[engine],
						url: self.domains[0] + self.urls[url],
						size: self.sizes[size],
						output: image
					});
				}
			}
		}
	}

	log.info('Taking screenshots');

	var bar = false;
	if(!this.quiet) {
		bar = new progress(':bar :elapseds :current/:total', {total: screenshotQueue.length});
	}

	var webshot = require('webshot');
	async.eachLimit(screenshotQueue, self.maxConnections, function(task, callback) {
		webshot(task.url, task.output, {
			windowSize: {
				width:  task.size,
				height: 300
			},
			shotSize: {
				width:  task.size,
				height: 'all'
			},
			defaultWhiteBackground: true,
			phantomPath: self.getEnginePath[task.engine],
			phantomConfig: {
				'debug':       'false',
				'load-images': 'true'
			}
		}, function(err) {
			if( err ) {
				log.error('An error occurred');
				log.error(err);
				return self;
			} else {
				if(bar) {
					bar.tick();
				}
				callback();
			}
		});

	}, function(err) {
		if( err ) {
			log.error('An error occurred during screenshotting');
			process.exit(1);
			return self;
		} else {
			log.success('Screenshots done');
			self.compareScreenshots();
			return self;
		}
	});
};

Wraith.prototype.getEnginePath = function(engine) {
	if(engine == 'phantomjs') {
		return phantomjs.path;
	} else {
		return engine;
	}
};

Wraith.prototype.compareScreenshots = function() {
	var self        = this;
	var fileLabels  = [];

	if( self.engines.length === 1 ) {
		fileLabels = [self.domainLabels[0], self.domainLabels[1]];
	} else {
		fileLabels = [self.engines[0], self.engines[1]];
	}

	self.compareQueue = [];

	for(var url in self.urls) {
		var dir = self.urls[url].substring(1).replace(/\/+$/,'') + '/';
		var folder = path.join(self.outputFolder, dir);
		for(var size in self.sizes) {
			var item = {
				'dir': ( size > 0 ? false : folder),
				'sort': folder + size,
				'base': folder + fileLabels[0]  + '_' + self.sizes[size] + '.png',
				'compare': folder + fileLabels[1] + '_' + self.sizes[size] + '.png',
				'output': folder + self.sizes[size] + '_diff.png',
				'diff': folder +  self.sizes[size] + '_diff.txt',
				'size': self.sizes[size]
			};
			self.compareQueue.push(item);
		}
	}

	resemble.outputSettings({
		errorColor: {
			red: 200,
			green: 0,
			blue: 0
		},
		errorType: 'movementWithDistanceBasedIntensity',
		transparency: 0.4,
		largeImageThreshold: 0
	});

	var bar = false;
	if(!this.quiet) {
		bar = new progress(':bar :elapseds :current/:total', { total: self.compareQueue.length });
	}

	log.info('Comparing images');
	async.eachLimit(self.compareQueue, self.maxConnections, function(task, callback) {
		resemble('./' + task.base).compareTo('./' + task.compare).ignoreAntialiasing().onComplete(function(data) {
			data.getDiffImage().pack().pipe(fs.createWriteStream(task.output));
			fs.writeFile('./' + task.diff, data.misMatchPercentage, function(err) {
				if(err) { log.error(err); }
				if(bar) {
					bar.tick();
				}
				callback();
			});
		});
	}, function(err) {
		if( err ) {
			log.log(err);
			log.error('An error occurred during comparison');
			process.exit(1);
			return self;
		} else {
			log.success('Image comparison done');
			self.generateGallery();
			return self;
		}
	});
};

Wraith.prototype.generateGallery = function() {
	var self = this;
	gallery.generate(self.dirs, self.compareQueue, self.outputFolder, self.config.project, self.cb);
};
