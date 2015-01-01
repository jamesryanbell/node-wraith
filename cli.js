#!/usr/bin/env node
'use strict';

var moment  = require('moment');
var program = require('commander');
var log     = require('./lib/logger');

program.unknownOption = program.help;
program
	.usage('[options] <file ...>')
	.version(require('./package').version)
	.option('-c, --config [config]', 'You must specifiy a configuration file')
	.option('-q, --quiet', 'All logging is hidden')
	.parse(process.argv);

if(!program.config) {
	program.help();
} else {
	var wraith = require('./lib/wraith');
	var config = require(program.config);
	var timer  = false;

	if(program.quiet) {
		config.quiet = true;
	} else {
		timer = moment();
	}

	new wraith(config, function() {
		if(timer) {
			log.info('Time Taken: ' + moment().diff(timer, 'seconds') + 's');
		}
		log.success('Done');
	});

}
