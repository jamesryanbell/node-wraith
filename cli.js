#!/usr/bin/env node
'use strict';

var program = require('commander'),
	chalk  = require('chalk'),
	wraith = require('./index');

	program.unknownOption = program.help;
	program
		.usage('[options] <file ...>')
		.version(require('./package').version)
		.option('-c, --config [config]', 'You must specifiy a configuration file')
		.parse(process.argv);

if(!program.config) {
	program.help();
} else {
	wraith.run(program.config);
}