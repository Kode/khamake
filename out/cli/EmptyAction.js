"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
class EmptyAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Empty,
            summary: 'build for the Empty target',
            documentation: 'build for the Empty target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Empty;
        return super.onExecute();
    }
}
exports.EmptyAction = EmptyAction;
//# sourceMappingURL=EmptyAction.js.map