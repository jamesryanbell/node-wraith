'use strict';

var fs = require('fs'),
	wraith = require('./lib/wraith'),
	spider = require('./lib/spider');

module.exports.run = run;

function run(configFile) {

	var	domains = [],
		domainLabels = [],
		outputFolder = '',
		baseFolder = process.cwd() + '/';

	var config = require(baseFolder + 'config/' + configFile + '.json');

	outputFolder = typeof config.outputDir === 'undefined' ? baseFolder + 'shots/' : baseFolder + 'shots/' + config.outputDir;

	for(var domain in config.domains) {
		domains.push(config.domains[domain].replace(/\/+$/, ''));
		domainLabels.push(domain);
	}

	if( !config.fuzz ) {
		config.fuzz = '20%';
	}

	if( !config.maxConnections ) {
		config.maxConnections = 20;
	}

	if(config.snap) {
		config.snap = baseFolder + config.snap;
	} else {
		config.snap = __dirname + '/snap.js';
	}

	var cb = function() {
		console.log('Done');
	};

	if( config.paths &&  config.paths.length > 0 ) {
		wraith(config, config.engines, domains, config.sizes, domainLabels, outputFolder, cb);
	} else if( config.spider ) {
		config.spider = baseFolder + config.spider;
		if (!fs.existsSync(config.spider)) {
			spider(domains[0], config.spider, function() {
				wraith(config, config.engines, domains, config.sizes, domainLabels, outputFolder, cb);
			});
		} else {
			wraith(config, config.engines, domains, config.sizes, domainLabels, outputFolder, cb);
		}
	}
}