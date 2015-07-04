var path = require('path');

var korepath = path.join(__dirname, '..', '..', 'Kore', 'Tools', 'koremake');

exports.init = function (options) {
	korepath = path.join(options.kha, 'Kore', 'Tools', 'koremake');
};

exports.get = function () {
	return korepath;
};
