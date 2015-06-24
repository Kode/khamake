var fs = require('fs-extra');
var path = require('path');
var XmlWriter = require('./XmlWriter.js');

exports.hxml = function (projectdir, options) {
	var data = '';
	for (var i = 0; i < options.sources.length; ++i) {
		if (path.isAbsolute(options.sources[i])) {
			data += '-cp ' + options.sources[i] + '\n';
		}
		else {
			data += '-cp ' + path.relative(projectdir, path.join(options.from, options.sources[i])) + '\n'; // from.resolve('build').relativize(from.resolve(this.sources[i])).toString());
		}
	}
	for (var d in options.defines) {
		var define = options.defines[d];
		data += '-D ' + define + '\n';
	}
	if (options.language === 'cpp') {
		data += '-cpp ' + path.normalize(options.to) + '\n';
	}
	else if (options.language === 'cs') {
		data += '-cs ' + path.normalize(options.to) + '\n';
		if (fs.existsSync(options.haxeDirectory) && fs.statSync(options.haxeDirectory).isDirectory()) {
			data += '-net-std ' + path.relative(projectdir, path.join(options.haxeDirectory, 'netlib')) + '\n';
		}
	}
	else if (options.language === 'java') {
		data += '-java ' + path.normalize(options.to) + '\n';
		if (fs.existsSync(options.haxeDirectory) && fs.statSync(options.haxeDirectory).isDirectory()) {
			data += '-java-lib ' + path.relative(projectdir, path.join(options.haxeDirectory, 'hxjava', 'hxjava-std.jar')) + '\n';
		}
	}
	else if (options.language === 'js') {
		data += '-js ' + path.normalize(options.to) + '\n';
	}
	else if (options.language === 'as') {
		data += '-swf ' + path.normalize(options.to) + '\n';
		data += '-swf-version 11.6\n';
	}
	data += '-main Main' + '\n';
	fs.outputFileSync(path.join(projectdir, 'project-' + options.system + '.hxml'), data);
};

exports.FlashDevelopment = function (projectdir, options) {
	var platform;

	switch (options.language) {
		case 'cpp':
			platform = 'C++';
			break;
		case 'as':
			platform = 'Flash Player';
			break;
		case 'cs':
			platform = 'C#';
			break;
		case 'java':
			platform = 'Java';
			break;
		case 'js':
			platform = 'JavaScript';
			break;
	}

	var output = {
		n: 'output',
		e: [
			{
				n: 'movie',
				outputType: 'Application'
			},
			{
				n: 'movie',
				input: ''
			},
			{
				n: 'movie',
				path: path.normalize(options.to)
			},
			{
				n: 'movie',
				fps: 60
			},
			{
				n: 'movie',
				width: options.width
			},
			{
				n: 'movie',
				height: options.height
			},
			{
				n: 'movie',
				version: 11
			},
			{
				n: 'movie',
				minorVersion: 6
			},
			{
				n: 'movie',
				platform: platform
			},
			{
				n: 'movie',
				background: '#FFFFFF'
			}
		]
	};

	if (fs.existsSync(options.haxeDirectory) && fs.statSync(options.haxeDirectory).isDirectory()) {
		output.e.push({
			n: 'movie',
			preferredSDK: path.relative(projectdir, options.haxeDirectory)
		});
	}

	var classpaths = {
		n: 'classpaths',
		e: [

		]
	};

	for (var i = 0; i < options.sources.length; ++i) {
		if (path.isAbsolute(options.sources[i])) {
			classpaths.e.push({
				n: 'class',
				path: options.sources[i]
			});
		}
		else {
			classpaths.e.push({
				n: 'class',
				path: path.relative(projectdir, path.join(options.from, options.sources[i]))
			});
		}
	}

	var otheroptions = [
		{
			n: 'option',
			showHiddenPaths: 'False'
		}
	];

	if (options.language === 'cpp') {
		otheroptions.push({
			n: 'option',
			testMovie: 'Custom'
		});
		otheroptions.push({
			n: 'option',
			testMovieCommand: 'run_' + options.system + '.bat'
		});
	}
	else if (options.language === 'cs' || options.language === 'java') {
		otheroptions.push({
			n: 'option',
			testMovie: 'OpenDocument'
		});
		otheroptions.push({
			n: 'option',
			testMovieCommand: ''
		});
	}
	else if (options.language === 'js') {
		otheroptions.push({
			n: 'option',
			testMovie: 'Webserver'
		});
		otheroptions.push({
			n: 'option',
			testMovieCommand: path.join(path.parse(options.to).dir, 'index.html')
		});
	}
	else {
		otheroptions.push({
			n: 'option',
			testMovie: 'Default'
		});
	}

	var def = '';
	for (var d in options.defines) {
		def += '-D ' + options.defines[d] + '\n';
	}
	if (options.language === 'java' && fs.existsSync(options.haxeDirectory) && fs.statSync(options.haxeDirectory).isDirectory()) {
		def += '-java-lib ' + path.relative(projectdir, path.join(options.haxeDirectory, 'hxjava', 'hxjava-std.jar')) + '\n';
	}
	if (options.language === 'cs' && fs.existsSync(options.haxeDirectory) && fs.statSync(options.haxeDirectory).isDirectory()) {
		def += '-net-std ' + path.relative(projectdir, path.join(options.haxeDirectory, 'netlib')) + '\n';
	}

	var project = {
		n: 'project',
		version: '2',
		e: [
			'Output SWF options',
			output,
			'Other classes to be compiled into your SWF',
			classpaths,
			'Build options',
			{
				n: 'build',
				e: [
					{
						n: 'option',
						directives: ''
					},
					{
						n: 'option',
						flashStrict: 'False'
					},
					{
						n: 'option',
						mainClass: 'Main'
					},
					{
						n: 'option',
						enableDebug: 'False'
					},
					{
						n: 'option',
						additional: def
					}
				]
			},
			'haxelib libraries',
			{
				n: 'haxelib',
				e: [
					'example: <library name="..." />'
				]
			},
			'Class files to compile (other referenced classes will automatically be included)',
			{
				n: 'compileTargets',
				e: [
					{
						n: 'compile',
						path: '..\\Sources\\Main.hx'
					}
				]
			},
			'Paths to exclude from the Project Explorer tree',
			{
				n: 'hiddenPaths',
				e: [
					'example: <hidden path="..." />'
				]
			},
			'Executed before build',
			{
				n: 'preBuildCommand'
			},
			'Executed after build',
			{
				n: 'postBuildCommand',
				alwaysRun: 'False'
			},
			'Other project options',
			{
				n: 'options',
				e: otheroptions
			},
			'Plugin storage',
			{
				n: 'storage'
			}
		]
	};

	XmlWriter(project, path.join(projectdir, 'project-' + options.system + '.hxproj'));
};
