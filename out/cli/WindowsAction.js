"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
const VisualStudioVersion_1 = require("../VisualStudioVersion");
const VrApi_1 = require("../VrApi");
const RayTraceApi_1 = require("../RayTraceApi");
const GraphicsApi_1 = require("../GraphicsApi");
class WindowsAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Windows,
            summary: 'build for the Windows target',
            documentation: 'build for the Windows target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Windows;
        this._options.visualstudio = this._visualStudio.value;
        this._options.vr = this._vrApi.value;
        this._options.raytrace = this._rayTraceAPI.value;
        this._options.graphics = this._graphicsAPI.value;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
        return super.onExecute();
    }
    onDefineParameters() {
        super.onDefineParameters();
        this._visualStudio = this.defineChoiceParameter({
            parameterShortName: "-v",
            parameterLongName: "--visualstudio",
            description: "Version of Visual Studio to use",
            alternatives: [
                VisualStudioVersion_1.VisualStudioVersion.VS2010,
                VisualStudioVersion_1.VisualStudioVersion.VS2012,
                VisualStudioVersion_1.VisualStudioVersion.VS2013,
                VisualStudioVersion_1.VisualStudioVersion.VS2015,
                VisualStudioVersion_1.VisualStudioVersion.VS2017,
            ],
            defaultValue: VisualStudioVersion_1.VisualStudioVersion.VS2017
        });
        this._vrApi = this.defineChoiceParameter({
            parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi_1.VrApi.None,
                VrApi_1.VrApi.Oculus,
            ],
            defaultValue: VrApi_1.VrApi.None
        });
        this._rayTraceAPI = this.defineChoiceParameter({
            parameterLongName: "--raytrace",
            description: "Target raytracing API",
            alternatives: [
                RayTraceApi_1.RayTraceApi.None,
                RayTraceApi_1.RayTraceApi.DXR,
            ],
            defaultValue: RayTraceApi_1.RayTraceApi.None
        });
        this._graphicsAPI = this.defineChoiceParameter({
            parameterShortName: "-g",
            parameterLongName: "--graphics",
            description: "Graphics api to use",
            alternatives: [
                GraphicsApi_1.GraphicsApi.Default,
                GraphicsApi_1.GraphicsApi.OpenGL,
                GraphicsApi_1.GraphicsApi.Direct3D9,
                GraphicsApi_1.GraphicsApi.Direct3D11,
                GraphicsApi_1.GraphicsApi.Direct3D12,
                GraphicsApi_1.GraphicsApi.Vulkan,
            ],
            defaultValue: GraphicsApi_1.GraphicsApi.Default
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
exports.WindowsAction = WindowsAction;
//# sourceMappingURL=WindowsAction.js.map