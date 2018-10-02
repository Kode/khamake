import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { GraphicsApi } from '../GraphicsApi';

export class OSXAction extends BuildAction {
	private _graphicsAPI: CommandLineChoiceParameter;
    private _compile: CommandLineFlagParameter;
    private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.OSX,
			summary: 'build for the OSX target',
			documentation: 'build for the OSX target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.OSX;
        this._options.graphics = this._graphicsAPI.value;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
		return super.onExecute();
	}
	
	protected onDefineParameters(): void { //abstract
		super.onDefineParameters();
        this._graphicsAPI = this.defineChoiceParameter({
            parameterShortName: "-g",
			parameterLongName: "--graphics",
            description: "Graphics api to use",
            alternatives: [
                GraphicsApi.Default,
                GraphicsApi.OpenGL,
                GraphicsApi.Metal,
            ],
            defaultValue: GraphicsApi.Default
        });
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