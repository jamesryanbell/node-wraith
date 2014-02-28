#!/usr/bin/env node
'use strict';
var nopt = require('nopt');
var chalk = require('chalk');
var wraith = require('./index');

function showHelp() {
	console.log('A responsive screenshot comparison tool.');
	console.log('Based on the Ruby version available at http://github.comm/BBC-News/wraith');
	console.log('');
	console.log(chalk.underline('Usage'));
	console.log('  wraith --config <file>');
	console.log('');
	console.log(chalk.underline('Example'));
	console.log('  wraith --config chrome');
	console.log('');
}

function getStdin(cb) {
	var ret = '';

	process.stdin.resume();
	process.stdin.setEncoding('utf8');

	process.stdin.on('data', function (data) {
		ret += data;
	});

	process.stdin.on('end', function () {
		cb(ret);
	});
}

function init(args) {
	if (opts.help) {
		return showHelp();
	}

	if (opts.version) {
		return console.log(require('./package').version);
	}

	var config = args;
	if( opts.config && args[0]) {
		if (config.length === 0) {
			console.error(chalk.yellow('You must specifiy a configuration file'));
			return showHelp();
		} else {
			return wraith.run(args[0]);
		}
	}

	return showHelp();
}

var opts = nopt({
	help: Boolean,
	version: Boolean,
	config: Boolean
}, {
	h: '--help',
	v: '--version',
	c: '--config'
});

var args = opts.argv.remain;

if (process.stdin.isTTY) {
	init(args);
} else {
	getStdin(function (data) {
		[].push.apply(args, data.trim().split('\n'));
		init(args);
	});
}

