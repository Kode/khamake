import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { VrApi } from '../VrApi';
import { GraphicsApi } from '../GraphicsApi';

export class iOSAction extends BuildAction {
	private _vrApi: CommandLineChoiceParameter;
    private _graphicsAPI: CommandLineChoiceParameter;
    private _compile: CommandLineFlagParameter;
    private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.iOS,
			summary: 'build for the iOS target',
			documentation: 'build for the iOS target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.iOS;
        this._options.vr = this._vrApi.value;
        this._options.graphics = this._graphicsAPI.value;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
		return super.onExecute();
	}
	
	protected onDefineParameters(): void { //abstract
		super.onDefineParameters();
        this._vrApi = this.defineChoiceParameter({
			parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi.None,
                VrApi.Cardboard,
            ],
            defaultValue: VrApi.None
        });
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