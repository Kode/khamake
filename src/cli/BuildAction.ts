import { CommandLineAction, CommandLineParameter, ICommandLineActionOptions, CommandLineChoiceParameter, CommandLineStringParameter } from "@microsoft/ts-command-line";
import { Options } from '../Options';
import { VrApi } from '../VrApi';
import { RayTraceApi } from "../RayTraceApi";
import { GraphicsApi } from "../GraphicsApi";

export class BuildAction extends CommandLineAction {
    private _options: Options;

    private _vrApi: CommandLineChoiceParameter;
    private _rayTraceAPI: CommandLineChoiceParameter;
    private _main: CommandLineStringParameter;
    private _intermediate: CommandLineStringParameter;
    private _graphicsAPI: CommandLineChoiceParameter;

	public constructor(options: ICommandLineActionOptions) {
		super(options);
	}

	protected onExecute(): Promise<void> { // abstract
		// TODO: actually make it run!
		return Promise.resolve();
	}

    protected onDefineParameters(): void { // abstract
        this._vrApi = this.defineChoiceParameter({
			parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi.None,
                VrApi.GearVr,
                VrApi.Cardboard,
                VrApi.Oculus,
                VrApi.WebVR
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
        this._main = this.defineStringParameter({
			parameterLongName: "--main",
            description: "Entrypoint for the haxe code (-main argument), defaults to \"Main\"",
            argumentName: "CLASS",
            defaultValue: "Main"
        });
        this._intermediate = this.defineStringParameter({
			parameterLongName: "--intermediate",
            description: "Intermediate location for object files",
            argumentName: "PATH",
            defaultValue: ""
        });
        this._graphicsAPI = this.defineChoiceParameter({
            parameterShortName: "-g",
			parameterLongName: "--graphics",
            description: "Graphics api to use",
            alternatives: [
                GraphicsApi.Default,
                GraphicsApi.OpenGL,
                GraphicsApi.OpenGL1,
                GraphicsApi.Direct3D9,
                GraphicsApi.Direct3D11,
                GraphicsApi.Direct3D12,
                GraphicsApi.Metal,
                GraphicsApi.Vulkan,
            ],
            defaultValue: GraphicsApi.Default
        });
	}
}