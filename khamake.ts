// Called from entry point, e.g. Kha/make.js
// This is where options are processed:
// e.g. '-t html5 --server'

"use strict";

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {sys} from './exec';
import * as korepath from './korepath';
import {GraphicsApi} from './GraphicsApi';
import {VrApi} from './VrApi';
import {Options} from './Options';
import {Platform} from './Platform';
import {VisualStudioVersion} from './VisualStudioVersion';

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

var options: Array<any> = [
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
		full: 'ffmpeg',
		description: 'Location of ffmpeg executable',
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
	},
	{
		full: 'watch',
		short: 'w',
		description: 'Watch files and recompile on change.',
		value: false
	}
];

let parsedOptions = new Options();

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

async function runKhamake() {
	try {
		await require('./main.js').run(parsedOptions, { info: console.log, error: console.log }, function (name) { });
	}
	catch (error) {
		console.log(error);
	}
}

if (parsedOptions.init) {
	console.log('Initializing Kha project.\n');
	require('./init').run(parsedOptions.name, parsedOptions.from, parsedOptions.projectfile);
	console.log('If you want to use the git version of Kha, execute "git init" and "git submodule add https://github.com/ktxsoftware/Kha.git".');
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
	runKhamake();
}
