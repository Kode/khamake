"use strict";
const Html5Exporter_1 = require('./Html5Exporter');
class DebugHtml5Exporter extends Html5Exporter_1.Html5Exporter {
    constructor(options) {
        super(options);
    }
    sysdir() {
        return 'debug-html5';
    }
}
exports.DebugHtml5Exporter = DebugHtml5Exporter;
//# sourceMappingURL=DebugHtml5Exporter.js.map