"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
class TizenAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Tizen,
            summary: 'build for the Tizen target',
            documentation: 'build for the Tizen target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Tizen;
        this._options.compile = this._compile.value;
        this._options.run = this._run.value;
        return super.onExecute();
    }
    onDefineParameters() {
        super.onDefineParameters();
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
exports.TizenAction = TizenAction;
//# sourceMappingURL=TizenAction.js.map