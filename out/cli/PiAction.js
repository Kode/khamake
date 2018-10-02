"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
class PiAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Pi,
            summary: 'build for the Pi target',
            documentation: 'build for the Pi target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Pi;
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
exports.PiAction = PiAction;
//# sourceMappingURL=PiAction.js.map