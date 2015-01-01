'use strict';

module.exports.sortByProp = function(prop) {
	return function(a,b) {
		if( a[prop] > b[prop]){
			return 1;
		} else if( a[prop] < b[prop] ) {
			return -1;
		}
		return 0;
	};
};

module.exports.emptyFolder = function(folder, cb) {
	if( typeof(folder) === 'undefined' ) { return false; }

	var rimraf = require('rimraf');
	rimraf(folder, function(err) {
		if( err ) { throw err; }
		cb();
	});
	return true;
};