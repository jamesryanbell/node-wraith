'use strict';

var path = require('path'),
	exec = require('child_process').exec;

module.exports.compare = compare;
module.exports.take = take;

function take(engine, snapFile, url, size, output, callback) {
	var command,
		hrTime = process.hrtime(),
		tempProfileName = hrTime[1];

	command = engine + ' "' + snapFile + '" ' + url + ' ' + size + ' "' + output + '"';
	if( engine === 'slimerjs' ) {
		var rmdir = require('rimraf');
		var temp_profile_path = path.join(__dirname, '/../_temp/ff_profiles/', tempProfileName);
		command += ' -profile "' + temp_profile_path + '" -no-remote -safe-mode';
	}

	var cmd = exec(command, callback);
	cmd.stdout.on('data', function (data) {
		//stdout
		if( data !== '' ) { console.log(data); }
	});

	cmd.stderr.on('data', function (data) {
		//stderr
		if( data !== '' ) { console.log(data); }
	});

	cmd.on('exit', function (code) {
		if( engine === 'slimerjs' ) { rmdir(temp_profile_path, function(error){}); }
		//console.log('child process exited with code ' + code);
	});
}

function compare(base, compare, output, info, fuzz, callback) {
	var cmd = exec('compare -quiet -fuzz ' + fuzz + ' -metric AE -highlight-color blue ' + base + ' ' + compare + ' ' + output + ' 2>' + info, callback);

	cmd.stdout.on('data', function (data) {
		//stdout
		if( data !== '' ) { console.log(data); }
	});

	cmd.stderr.on('data', function (data) {
		//stderr
		if( data !== '' ) { console.log(data); }
	});
}