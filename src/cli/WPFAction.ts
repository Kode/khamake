import { BuildAction } from './BuildAction';
import { Platform } from '../Platform';
import { CommandLineChoiceParameter, CommandLineFlagParameter } from '@microsoft/ts-command-line';
import { VisualStudioVersion } from '../VisualStudioVersion';
import { VrApi } from '../VrApi';
import { RayTraceApi } from '../RayTraceApi';

export class WPFAction extends BuildAction {
	private _visualStudio: CommandLineChoiceParameter;
	private _vrApi: CommandLineChoiceParameter;
    private _rayTraceAPI: CommandLineChoiceParameter;
    private _compile: CommandLineFlagParameter;
    private _run: CommandLineFlagParameter;
	
	public constructor() {
		super({
			actionName: Platform.WPF,
			summary: 'build for the WPF target',
			documentation: 'build for the WPF target'
		});
	}

    protected onExecute(): Promise<void> { // abstract
        this.prepareBaseOptions();
        this._options.target = Platform.WPF;
        this._options.visualstudio = this._visualStudio.value;
        this._options.vr = this._vrApi.value;
        this._options.raytrace = this._rayTraceAPI.value;
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