"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
const VisualStudioVersion_1 = require("../VisualStudioVersion");
class XBox360Action extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Xbox360,
            summary: 'build for the Xbox360 target',
            documentation: 'build for the Xbox360 target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Xbox360;
        this._options.visualstudio = this._visualStudio.value;
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
exports.XBox360Action = XBox360Action;
//# sourceMappingURL=XBox360Action.js.map