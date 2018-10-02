"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
const VrApi_1 = require("../VrApi");
class DebugHTML5Action extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.DebugHTML5,
            summary: 'build for the DebugHTML5 target',
            documentation: 'build for the DebugHTML5 target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.DebugHTML5;
        this._options.vr = this._vrApi.value;
        return super.onExecute();
    }
    onDefineParameters() {
        super.onDefineParameters();
        this._vrApi = this.defineChoiceParameter({
            parameterLongName: "--vr",
            description: "Target VR device",
            alternatives: [
                VrApi_1.VrApi.None,
                VrApi_1.VrApi.WebVR,
            ],
            defaultValue: VrApi_1.VrApi.None
        });
    }
}
exports.DebugHTML5Action = DebugHTML5Action;
//# sourceMappingURL=DebugHtml5Action.js.map