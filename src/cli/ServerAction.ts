import { CommandLineAction, CommandLineParameter } from "@microsoft/ts-command-line";

export class ServerAction extends CommandLineAction {
	private _port: CommandLineParameter;
	private _from: CommandLineParameter;

	public constructor() {
		super({
			actionName: 'server',
			summary: 'Run local http server for html5 target',
			documentation: 'Run local http server for html5 target'
		});
	}

	protected onExecute(): Promise<void> { // abstract
		// TODO: actually make it run!
		return Promise.resolve();
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
	}
}