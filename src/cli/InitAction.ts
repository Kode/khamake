import { CommandLineAction, CommandLineStringParameter } from "@microsoft/ts-command-line";

export class InitAction extends CommandLineAction {
	private _name: CommandLineStringParameter;
	private _from: CommandLineStringParameter;
	private _projectFile: CommandLineStringParameter;

	public constructor() {
		super({
			actionName: 'init',
			summary: 'Init a Kha project',
			documentation: 'Init a Kha project inside the current directory'
		});
	}

	protected onExecute(): Promise<void> { // abstract
		// TODO: actually make it run!
		return Promise.resolve();
	}

	protected onDefineParameters(): void { // abstract
		this._name = this.defineStringParameter({
			argumentName: "NAME",
			parameterShortName: "-n",
			parameterLongName: "--name",
			description: "Project name to use when initializing a project",
			defaultValue: "Project"
		});
		this._from = this.defineStringParameter({
			argumentName: "PATH",
			parameterShortName: "-f",
			parameterLongName: "--from",
			description: "Location of your project",
			defaultValue: "."
		});
		this._projectFile = this.defineStringParameter({
			argumentName: "PATH",
			parameterLongName: "--projectfile",
			description: "Name of your project file",
			defaultValue: "khafile.js"
		});
	}
}