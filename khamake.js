var os = require('os');
var korepath = require('./korepath.js');
var Files = require(korepath + 'Files.js');
var GraphicsApi = require('./GraphicsApi.js');
var Options = require('./Options.js');
var Path = require(korepath + 'Path.js');
var Paths = require(korepath + 'Paths.js');
var Platform = require('./Platform.js');
var VisualStudioVersion = require('./VisualStudioVersion.js');

if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}

if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || this.length;
			position = position - searchString.length;
			var lastIndex = this.lastIndexOf(searchString);
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}

if (os.platform() === "linux") {
	var defaultTarget = Platform.Linux;
}
else if (os.platform() === "win32") {
	var defaultTarget = Platform.Windows;
}
else {
	var defaultTarget = Platform.OSX;
}

var options = [
	{
		full: 'from',
		value: true,
		description: 'Location of your project',
		default: '.'
	},
	{
		full: 'to',
		value: true,
		description: 'Build location',
		default: 'build'
	},
	{
		full: 'target',
		short: 't',
		value: true,
		description: 'Target platform',
		default: defaultTarget
	},
	{
		full: 'pch',
		description: 'Use precompiled headers for C++ targets',
		value: false,
		hidden: true
	},
	{
		full: 'intermediate',
		description: 'Intermediate location for object files.',
		value: true,
		default: '',
		hidden: true
	},
	{
		full: 'graphics',
		short: 'g',
		description: 'Graphics api to use',
		value: true,
		default: GraphicsApi.Direct3D9
	},
	{
		full: 'visualstudio',
		short: 'v',
		description: 'Version of Visual Studio to use',
		value: true,
		default: VisualStudioVersion.VS2013
	},
	{
		full: 'kha',
		short: 'k',
		description: 'Location of Kha directory',
		value: true,
		default: ''
	},
	{
		full: 'haxe',
		short: 'h',
		description: 'Location of Haxe directory',
		value: true,
		default: ''
	},
	{
		full: 'ogg',
		description: 'Argument line for ogg encoder',
		value: true,
		default: ''
	},
	{
		full: 'aac',
		description: 'Argument line for aac encoder',
		value: true,
		default: ''
	},
	{
		full: 'mp3',
		description: 'Argument line for mp3 encoder',
		value: true,
		default: ''
	},
	{
		full: 'h264',
		description: 'Argument line for h264 encoder',
		value: true,
		default: ''
	},
	{
		full: 'webm',
		description: 'Argument line for webm encoder',
		value: true,
		default: ''
	},
	{
		full: 'wmv',
		description: 'Argument line for wmv encoder',
		value: true,
		default: ''
	},
	{
		full: 'theora',
		description: 'Argument line for theora encoder',
		value: true,
		default: ''
	},
	{
		full: 'kfx',
		description: 'Location of kfx shader compiler',
		value: true,
		default: ''
	},
	{
		full: 'krafix',
		description: 'Location of krafix shader compiler',
		value: true,
		default: ''
	},
	{
		full: 'embedflashassets',
		description: 'Embed assets in swf for flash target',
		value: false
	},
	{
		full: 'compile',
		description: 'Compile executable',
		value: false
	},
	{
		full: 'run',
		description: 'Run executable',
		value: false
	},
	{
		full: 'server',
		description: 'Run local http server for html5 target',
		value: false
	}
];

var parsedOptions = {

};

function printHelp() {
	console.log('khamake options:\n');
	for (var o in options) {
		var option = options[o];
		if (option.hidden) continue;
		if (option.short) console.log('-' + option.short + ' ' + '--' + option.full);
		else console.log('--' + option.full);
		console.log(option.description);
		console.log();
	}
}

for (var o in options) {
	var option = options[o];
	if (option.value) {
		parsedOptions[option.full] = option.default;
	}
	else {
		parsedOptions[option.full] = false;
	}
}

var args = process.argv;
for (var i = 2; i < args.length; ++i) {
	var arg = args[i];

	if (arg[0] == '-') {
		if (arg[1] == '-') {
			if (arg.substr(2) === 'help') {
				printHelp();
				process.exit(0);
			}
			for (var o in options) {
				var option = options[o];
				if (arg.substr(2) === option.full) {
					if (option.value) {
						++i;
						parsedOptions[option.full] = args[i];
					}
					else {
						parsedOptions[option.full] = true;
					}
				}
			}
		}
		else {
			if (arg[1] === 'h') {
				printHelp();
				process.exit(0);
			}
			for (var o in options) {
				var option = options[o];
				if (option.short && arg[1] === option.short) {
					if (option.value) {
						++i;
						parsedOptions[option.full] = args[i];
					}
					else {
						parsedOptions[option.full] = true;
					}
				}
			}
		}
	}
	else {
		parsedOptions.target = arg;
	}
}

if (parsedOptions.server) {
	console.log('Running server on 8080');
	var static = require('node-static');
	var fileServer = new static.Server('./build/html5');
	require('http').createServer(function (request, response) {
		request.addListener('end', function () {
			fileServer.serve(request, response);
		}).resume();
	}).listen(8080);
}
else {
	require('./main.js').run(parsedOptions, { info: console.log, error: console.log }, function (name) { });
}
