'use strict';

var fs     = require('fs'),
	wraith = require('./lib/wraith'),
	spider = require('./lib/spider'),
	chalk  = require('chalk'),
	path   = require('path'),
	rmdir  = require('rimraf');

module.exports.run = run;

function run(configFile) {

	var	domains = [],
		domainLabels = [],
		outputFolder = '',
		baseFolder = path.join(process.cwd(), '/'),
		config = null;

	try  {
		config = require(path.join(baseFolder, configFile));
	} catch(err) {
		console.error(chalk.red('Configuration file specified could not be found or accessed'));
		return false;
	}

	outputFolder = path.join(baseFolder, config.outputDir || 'shots/');

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
		config.snap = path.join(baseFolder, config.snap);
	} else {
		config.snap = path.join(__dirname, '/snap.js');
	}

	var cb = function() {
		var temp_path = path.join(__dirname, '/_temp');
		//rmdir(temp_path + '/ff_profiles');
		rmdir(temp_path, function(error){});
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