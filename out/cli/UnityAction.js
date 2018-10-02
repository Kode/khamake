"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
class UnityAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Unity,
            summary: 'build for the Unity target',
            documentation: 'build for the Unity target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Unity;
        return super.onExecute();
    }
}
exports.UnityAction = UnityAction;
//# sourceMappingURL=UnityAction.js.map