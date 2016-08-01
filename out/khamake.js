// Called from entry point, e.g. Kha/make.js
// This is where options are processed:
// e.g. '-t html5 --server'
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const os = require('os');
const path = require('path');
const GraphicsApi_1 = require('./GraphicsApi');
const VrApi_1 = require('./VrApi');
const Options_1 = require('./Options');
const Platform_1 = require('./Platform');
const VisualStudioVersion_1 = require('./VisualStudioVersion');
var defaultTarget;
if (os.platform() === "linux") {
    defaultTarget = Platform_1.Platform.Linux;
}
else if (os.platform() === "win32") {
    defaultTarget = Platform_1.Platform.Windows;
}
else {
    defaultTarget = Platform_1.Platform.OSX;
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
        default: VrApi_1.VrApi.None
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
        default: GraphicsApi_1.GraphicsApi.Direct3D9
    },
    {
        full: 'visualstudio',
        short: 'v',
        description: 'Version of Visual Studio to use. Possible parameters are vs2010, vs2012, vs2013 and vs2015.',
        value: true,
        default: VisualStudioVersion_1.VisualStudioVersion.VS2015
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
let parsedOptions = new Options_1.Options();
function printHelp() {
    console.log('khamake options:\n');
    for (var o in options) {
        var option = options[o];
        if (option.hidden)
            continue;
        if (option.short)
            console.log('-' + option.short + ' ' + '--' + option.full);
        else
            console.log('--' + option.full);
        console.log(option.description);
        console.log();
    }
}
function isTarget(target) {
    if (target.trim().length < 1)
        return false;
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
        if (isTarget(arg))
            parsedOptions.target = arg;
    }
}
if (parsedOptions.graphics === GraphicsApi_1.GraphicsApi.OpenGL) {
    parsedOptions.graphics = GraphicsApi_1.GraphicsApi.OpenGL2;
}
if (parsedOptions.run) {
    parsedOptions.compile = true;
}
function runKhamake() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield require('./main.js').run(parsedOptions, { info: console.log, error: console.log }, function (name) { });
        }
        catch (error) {
            console.log(error);
        }
    });
}
if (parsedOptions.init) {
    console.log('Initializing Kha project.\n');
    require('./init').run(parsedOptions.name, parsedOptions.from, parsedOptions.projectfile);
    console.log('If you want to use the git version of Kha, execute "git init" and "git submodule add https://github.com/ktxsoftware/Kha.git".');
}
else if (parsedOptions.server) {
    console.log('Running server on ' + parsedOptions.port);
    var nstatic = require('node-static');
    var fileServer = new nstatic.Server(path.join(parsedOptions.from, 'build', 'html5'), { cache: 0 });
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
//# sourceMappingURL=khamake.js.map