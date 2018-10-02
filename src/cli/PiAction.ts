import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineFlagParameter } from '@microsoft/ts-command-line';

export class PiAction extends BuildAction {
    private _compile: CommandLineFlagParameter;
	private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.Pi,
			summary: 'build for the Pi target',
			documentation: 'build for the Pi target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Pi;
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