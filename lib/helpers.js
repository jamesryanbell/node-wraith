'use strict';

var rimraf = require('rimraf');

module.exports.sortByProp = sortByProp;

function sortByProp(prop){
	return function(a,b){
		if( a[prop] > b[prop]){
			return 1;
		} else if( a[prop] < b[prop] ) {
			return -1;
		}
		return 0;
	};
}

module.exports.emptyFolder = emptyFolder;

function emptyFolder(folder, cb) {
	if( typeof(folder) === 'undefined' ) { return false; }

	rimraf(folder, function(err) {
		if( err ) { throw err; }
		cb();
	});

	return true;
}