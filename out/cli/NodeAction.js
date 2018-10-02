"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
class NodeAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.Node,
            summary: 'build for the Node target',
            documentation: 'build for the Node target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.Node;
        return super.onExecute();
    }
}
exports.NodeAction = NodeAction;
//# sourceMappingURL=NodeAction.js.map