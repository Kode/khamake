import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter } from '@microsoft/ts-command-line';
import { GraphicsApi } from '../GraphicsApi';

export class tvOSAction extends BuildAction {
	private _graphicsAPI: CommandLineChoiceParameter;
	
	public constructor() {
		super({
			actionName: Platform.tvOS,
			summary: 'build for the tvOS target',
			documentation: 'build for the tvOS target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.tvOS;
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
                GraphicsApi.Metal,
            ],
            defaultValue: GraphicsApi.Default
        });
	}
}