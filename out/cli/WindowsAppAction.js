"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
const VisualStudioVersion_1 = require("../VisualStudioVersion");
const VrApi_1 = require("../VrApi");
const RayTraceApi_1 = require("../RayTraceApi");
class WindowsAppAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.WindowsApp,
            summary: 'build for the WindowsApp target',
            documentation: 'build for the WindowsApp target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.WindowsApp;
        this._options.visualstudio = this._visualStudio.value;
        this._options.vr = this._vrApi.value;
        this._options.raytrace = this._rayTraceAPI.value;
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
exports.WindowsAppAction = WindowsAppAction;
//# sourceMappingURL=WindowsAppAction.js.map