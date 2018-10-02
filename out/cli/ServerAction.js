"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const ts_command_line_1 = require("@microsoft/ts-command-line");
class ServerAction extends ts_command_line_1.CommandLineAction {
    constructor() {
        super({
            actionName: 'server',
            summary: 'Run local http server for html5 target',
            documentation: 'Run local http server for html5 target'
        });
    }
    onExecute() {
        return new Promise(function (resolve, reject) {
            console.log('Running server on ' + this._port.value);
            let nstatic = require('node-static');
            let fileServer = new nstatic.Server(path.join(this._from.value, this._to.value, 'html5'), { cache: 0 });
            let server = require('http').createServer(function (request, response) {
                request.addListener('end', function () {
                    fileServer.serve(request, response);
                }).resume();
            });
            server.on('error', function (e) {
                if (e.code === 'EADDRINUSE') {
                    console.log('Error: Port ' + this._port.value + ' is already in use.');
                    console.log('Please close the competing program (maybe another instance of khamake?)');
                    console.log('or switch to a different port using the --port argument.');
                }
                reject(e.code);
            });
            server.listen(this._port.value);
        });
    }
    onDefineParameters() {
        this._port = this.defineIntegerParameter({
            argumentName: "PORT",
            parameterShortName: "-p",
            parameterLongName: "--port",
            description: "Running port for the server",
            defaultValue: 8080
        });
        this._from = this.defineStringParameter({
            argumentName: "PATH",
            parameterShortName: "-f",
            parameterLongName: "--from",
            description: "Location of your project",
            defaultValue: "."
        });
        this._to = this.defineStringParameter({
            argumentName: "PATH",
            parameterLongName: "--to",
            description: "Build location",
            defaultValue: "build"
        });
    }
}
exports.ServerAction = ServerAction;
//# sourceMappingURL=ServerAction.js.map