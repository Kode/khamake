import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { GraphicsApi } from '../GraphicsApi';

export class LinuxAction extends BuildAction {
	private _graphicsAPI: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.Linux,
			summary: 'build for the Linux target',
			documentation: 'build for the Linux target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Linux;
        this._options.graphics = this._graphicsAPI.value;
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
                GraphicsApi.Vulkan,
            ],
            defaultValue: GraphicsApi.Default
        });
	}
}