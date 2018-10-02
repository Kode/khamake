import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { VrApi } from '../VrApi';
import { GraphicsApi } from '../GraphicsApi';

export class AndroidAction extends BuildAction {
	private _vrApi: CommandLineChoiceParameter;
    private _graphicsAPI: CommandLineChoiceParameter;
    private _compile: CommandLineFlagParameter;
    private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.Android,
			summary: 'build for the Android target',
			documentation: 'build for the Android target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
		this._options.target = Platform.Android;
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
                VrApi.GearVr,
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
                GraphicsApi.Vulkan,
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