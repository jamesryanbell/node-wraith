'use strict';

var exec = require('child_process').exec;

module.exports.compare = compare;
module.exports.take = take;

function take(engine, snapFile, url, size, output, callback) {
	exec(engine + ' ' + snapFile + ' ' + url + ' ' + size + ' ' + output, callback);
}

function compare(base, compare, output, info, fuzz, callback) {
	exec('compare -quiet -fuzz ' + fuzz + ' -metric AE -highlight-color blue ' + base + ' ' + compare + ' ' + output + ' 2>' + info, callback);
}