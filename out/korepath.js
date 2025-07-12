"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.init = void 0;
const path = require("path");
const exec_1 = require("./exec");
let korepath = path.join(__dirname, '..', '..', '..', 'Kore', 'Tools', (0, exec_1.sysdir)());
function init(options) {
    korepath = path.join(options.kha, 'Kore', 'Tools', (0, exec_1.sysdir)());
}
exports.init = init;
function get() {
    return korepath;
}
exports.get = get;
//# sourceMappingURL=korepath.js.map