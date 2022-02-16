"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.init = void 0;
const path = require("path");
let korepath = path.join(__dirname, '..', '..', '..', 'Kinc', 'Tools', 'kmake');
function init(options) {
    korepath = path.join(options.kha, 'Kinc', 'Tools', 'kmake');
}
exports.init = init;
function get() {
    return korepath;
}
exports.get = get;
//# sourceMappingURL=korepath.js.map