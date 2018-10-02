import { run } from '../init';
import { CommandLineAction, CommandLineStringParameter } from "@microsoft/ts-command-line";

export class InitAction extends CommandLineAction {
	private _name: CommandLineStringParameter;
	private _from: CommandLineStringParameter;
	private _projectFile: CommandLineStringParameter;

	public constructor() {
		super({
			actionName: 'init',
			summary: 'Initialize a Kha project',
			documentation: 'Initialize a Kha project inside the current directory'
		});
	}

	protected onExecute(): Promise<void> { // abstract
		console.log('Initializing Kha project.\n');
		run(this._name.value, this._from.value, this._projectFile.value);
		console.log('If you want to use the git version of Kha, execute "git init" and "git submodule add https://github.com/Kode/Kha.git".');
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