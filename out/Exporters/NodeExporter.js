"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeExporter = void 0;
const Html5Exporter_1 = require("./Html5Exporter");
class NodeExporter extends Html5Exporter_1.Html5Exporter {
    constructor(options) {
        super(options);
    }
    backend() {
        return 'Node';
    }
    isNode() {
        return true;
    }
}
exports.NodeExporter = NodeExporter;
//# sourceMappingURL=NodeExporter.js.map