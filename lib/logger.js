'use strict';

var chalk      = require('chalk');
var logSymbols = require('log-symbols');

exports.error = function(msg, hide) {
	this.logger('error', logSymbols.error + ' ' + msg, hide);
};

exports.warn = function(msg, hide) {
	this.logger('warn', logSymbols.warning + ' ' + msg, hide);
};

exports.success = function(msg, hide) {
	this.logger('success', logSymbols.success + ' ' + msg, hide);
};

exports.info = function(msg, hide) {
	this.logger('info', logSymbols.info + ' ' + msg, hide);
};

exports.log = function(msg, hide) {
	this.logger('log', msg, hide);
};

exports.logger = function(level, msg, hide) {
	var color = false;
	switch(level) {
		case 'error':
			color = chalk.red.bold;
			break;
		case 'warn':
			color = chalk.yellow.bold;
			break;
		case 'info':
			color = chalk.blue.bold;
			break;
		case 'success':
			color = chalk.green.bold;
			break;
	}
	if(!hide && !this.quiet) {
		if(color) {
			console.log(color(msg));
		} else {
			console.log(msg);
		}
	}
};
