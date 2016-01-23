"use strict";

var version = Number(process.version.match(/^v(\d+\.\d+)/)[1]);

if (version < 4.0) {
	console.log('Sorry, this requires at least node version 4.0.');
	process.exit(1);
}

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

String.prototype.replaceAll = function (find, replace) {
	return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('./exec.js');
var korepath = require('./korepath.js');
var Files = require('./Files.js');
var GraphicsApi = require('./GraphicsApi.js');
var VrApi = require('./VrApi.js');
var Options = require('./Options.js');
var Path = require('./Path.js');
var Paths = require('./Paths.js');
var Platform = require('./Platform.js');
var VisualStudioVersion = require('./VisualStudioVersion.js');

var defaultTarget;
if (os.platform() === "linux") {
	defaultTarget = Platform.Linux;
}
else if (os.platform() === "win32") {
	defaultTarget = Platform.Windows;
}
else {
	defaultTarget = Platform.OSX;
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
		full: 'projectfile',
		value: true,
		description: 'Name of your project file, defaults to "khafile.js"',
		default: 'khafile.js'
	},
	{
		full: 'target',
		short: 't',
		value: true,
		description: 'Target platform',
		default: defaultTarget
	},
	{
		full: 'vr',
		value: true,
		description: 'Target VR device',
		default: VrApi.None
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
		description: 'Graphics api to use. Possible parameters are direct3d9, direct3d11, direct3d12, metal and opengl.',
		value: true,
		default: GraphicsApi.Direct3D9
	},
	{
		full: 'visualstudio',
		short: 'v',
		description: 'Version of Visual Studio to use. Possible parameters are vs2010, vs2012, vs2013 and vs2015.',
		value: true,
		default: VisualStudioVersion.VS2015
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
		full: 'nokrafix',
		description: 'Switch off the new shader compiler',
		value: false
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
		full: 'init',
		description: 'Init a Kha project inside the current directory',
		value: false
	},
	{
		full: 'name',
		description: 'Project name to use when initializing a project',
		value: true,
		default: 'Project'
	},
	{
		full: 'server',
		description: 'Run local http server for html5 target',
		value: false
	},
	{
		full: 'port',
		description: 'Running port for the server',
		value: true,
		default: 8080
	},
	{
		full: 'debug',
		description: 'Compile in debug mode for native targets.',
		value: false
	},
	{
		full: 'silent',
		description: 'Silent mode.',
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

function isTarget(target) {
	if (target.trim().length < 1) return false;
	return true;
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
		if (isTarget(arg)) parsedOptions.target = arg;
	}
}

if (parsedOptions.graphics === GraphicsApi.OpenGL) {
	parsedOptions.graphics = GraphicsApi.OpenGL2;
}

if (parsedOptions.run) {
	parsedOptions.compile = true;
}

if (parsedOptions.init) {
	console.log('Initializing Kha project.\n');
	require('./init.js').run(parsedOptions.name, parsedOptions.from, parsedOptions.projectfile);
	console.log('If you want to use the git version of Kha, execute "git init" and "git add submodule https://github.com/ktxsoftware/Kha.git".');
}
else if (parsedOptions.server) {
	console.log('Running server on ' + parsedOptions.port);
	var nstatic = require('node-static');
	var fileServer = new nstatic.Server(path.join(parsedOptions.from,'build', 'html5'), { cache: 0 });
	var server = require('http').createServer(function (request, response) {
		request.addListener('end', function () {
			fileServer.serve(request, response);
		}).resume();
	});
	server.on('error', function (e) {
		if (e.code == 'EADDRINUSE') {
			console.log('Error: Port ' + parsedOptions.port + ' is already in use.');
			console.log('Please close the competing program (maybe another instance of khamake?)');
			console.log('or switch to a different port using the --port argument.');
		}
	});
	server.listen(parsedOptions.port);
}
else {
	require('./main.js').run(parsedOptions, { info: console.log, error: console.log }, function (name) { });
}
