import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineFlagParameter } from '@microsoft/ts-command-line';

export class TizenAction extends BuildAction {
    private _compile: CommandLineFlagParameter;
	private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.Tizen,
			summary: 'build for the Tizen target',
			documentation: 'build for the Tizen target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Tizen;
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