import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineFlagParameter } from '@microsoft/ts-command-line';

export class JavaAction extends BuildAction {
    private _compile: CommandLineFlagParameter;
	private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.Java,
			summary: 'build for the Java target',
			documentation: 'build for the Java target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Java;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
		return super.onExecute();
	}

	protected onDefineParameters(): void { // abstract
		super.onDefineParameters();
        this._compile = this.defineFlagParameter({
            parameterLongName: "--compile",
            description: "Compile executable",
        });
        this._run = this.defineFlagParameter({
            parameterLongName: "--run",
            description: "Run executable",
        });
	}
}