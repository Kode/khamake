"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
const VrApi_1 = require("../VrApi");
const GraphicsApi_1 = require("../GraphicsApi");
class iOSAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.iOS,
            summary: 'build for the iOS target',
            documentation: 'build for the iOS target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.iOS;
        this._options.vr = this._vrApi.value;
        this._options.graphics = this._graphicsAPI.value;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
        return super.onExecute();
    }
    onDefineParameters() {
        super.onDefineParameters();
        this._vrApi = this.defineChoiceParameter({
            parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi_1.VrApi.None,
                VrApi_1.VrApi.Cardboard,
            ],
            defaultValue: VrApi_1.VrApi.None
        });
        this._graphicsAPI = this.defineChoiceParameter({
            parameterShortName: "-g",
            parameterLongName: "--graphics",
            description: "Graphics api to use",
            alternatives: [
                GraphicsApi_1.GraphicsApi.Default,
                GraphicsApi_1.GraphicsApi.OpenGL,
                GraphicsApi_1.GraphicsApi.Metal,
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
exports.iOSAction = iOSAction;
//# sourceMappingURL=IOSAction.js.map