"use strict";
const path = require('path');
const Html5Exporter_1 = require('./Html5Exporter');
class NodeExporter extends Html5Exporter_1.Html5Exporter {
    constructor(khaDirectory, directory) {
        super(khaDirectory, directory);
        this.removeSourceDirectory(path.join(khaDirectory, 'Backends', 'HTML5'));
        this.addSourceDirectory(path.join(khaDirectory, 'Backends', 'Node'));
    }
    sysdir() {
        return 'node';
    }
}
exports.NodeExporter = NodeExporter;
//# sourceMappingURL=NodeExporter.js.map