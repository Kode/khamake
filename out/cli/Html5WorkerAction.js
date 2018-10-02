"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BuildAction_1 = require("./BuildAction");
const Platform_1 = require("../Platform");
class HTML5WorkerAction extends BuildAction_1.BuildAction {
    constructor() {
        super({
            actionName: Platform_1.Platform.HTML5Worker,
            summary: 'build for the HTML5Worker target',
            documentation: 'build for the HTML5Worker target'
        });
    }
    onExecute() {
        this.prepareBaseOptions();
        this._options.target = Platform_1.Platform.HTML5Worker;
        return super.onExecute();
    }
}
exports.HTML5WorkerAction = HTML5WorkerAction;
//# sourceMappingURL=Html5WorkerAction.js.map