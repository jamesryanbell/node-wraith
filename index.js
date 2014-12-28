'use strict';

var fs     = require('fs'),
	wraith = require('./lib/wraith'),
	spider = require('./lib/spider'),
	chalk  = require('chalk'),
	rmdir  = require('rimraf');

module.exports.run = run;

function run(configFile) {
	try  {
		var config = require(configFile);
	} catch(err) {
		console.error(chalk.red.bold('Configuration file specified could not be found or accessed'));
		return false;
	}

	var cb = function() {
		var temp_path = path.join(__dirname, '/_temp');
		//rmdir(temp_path + '/ff_profiles');
		rmdir(temp_path, function(error){});
		console.log('Done');
	};

	if( config.paths &&  config.paths.length > 0 ) {
		wraith(config, cb);
	} else if( config.spider ) {
		config.spider = config.spider;
		if (!fs.existsSync(config.spider)) {
			spider(domains[0], config.spider, function() {
				wraith(config, cb);
			});
		} else {
			wraith(config, cb);
		}
	}
}