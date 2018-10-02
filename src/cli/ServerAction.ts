import * as path from 'path';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from "@microsoft/ts-command-line";

export class ServerAction extends CommandLineAction {
	private _port: CommandLineIntegerParameter;
	private _from: CommandLineStringParameter;
	private _to: CommandLineStringParameter;

	public constructor() {
		super({
			actionName: 'server',
			summary: 'Run local http server for html5 target',
			documentation: 'Run local http server for html5 target'
		});
	}

	protected onExecute(): Promise<void> { // abstract
		return new Promise<void>(function(resolve, reject):void {
			console.log('Running server on ' + this._port.value);
			let nstatic = require('node-static');
			let fileServer = new nstatic.Server(path.join(this._from.value, this._to.value, 'html5'), { cache: 0 });

			let server = require('http').createServer(function (request: any, response: any) {
				request.addListener('end', function () {
					fileServer.serve(request, response);
				}).resume();
			});
			server.on('error', function (e: any) {
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

	protected onDefineParameters(): void { // abstract
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