import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { VisualStudioVersion } from '../VisualStudioVersion';
import { VrApi } from '../VrApi';
import { RayTraceApi } from '../RayTraceApi';
import { GraphicsApi } from '../GraphicsApi';

export class WindowsAction extends BuildAction {
	private _visualStudio: CommandLineChoiceParameter;
	private _vrApi: CommandLineChoiceParameter;
    private _rayTraceAPI: CommandLineChoiceParameter;
    private _graphicsAPI: CommandLineChoiceParameter;
    private _compile: CommandLineFlagParameter;
    private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.Windows,
			summary: 'build for the Windows target',
			documentation: 'build for the Windows target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.Windows;
        this._options.visualstudio = this._visualStudio.value;
        this._options.vr = this._vrApi.value;
        this._options.raytrace = this._rayTraceAPI.value;
        this._options.graphics = this._graphicsAPI.value;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
		return super.onExecute();
	}

	protected onDefineParameters(): void { //abstract
        super.onDefineParameters();
        
        this._visualStudio = this.defineChoiceParameter({
            parameterShortName: "-v",
			parameterLongName: "--visualstudio",
            description: "Version of Visual Studio to use",
            alternatives: [
                VisualStudioVersion.VS2010,
                VisualStudioVersion.VS2012,
                VisualStudioVersion.VS2013,
                VisualStudioVersion.VS2015,
                VisualStudioVersion.VS2017,
            ],
            defaultValue: VisualStudioVersion.VS2017
		});
        this._vrApi = this.defineChoiceParameter({
			parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi.None,
                VrApi.Oculus,
            ],
            defaultValue: VrApi.None
        });
        this._rayTraceAPI = this.defineChoiceParameter({
			parameterLongName: "--raytrace",
            description: "Target raytracing API",
            alternatives: [
                RayTraceApi.None,
                RayTraceApi.DXR,
            ],
            defaultValue: RayTraceApi.None
        });
        this._graphicsAPI = this.defineChoiceParameter({
            parameterShortName: "-g",
			parameterLongName: "--graphics",
            description: "Graphics api to use",
            alternatives: [
                GraphicsApi.Default,
                GraphicsApi.OpenGL,
                GraphicsApi.Direct3D9,
                GraphicsApi.Direct3D11,
                GraphicsApi.Direct3D12,
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