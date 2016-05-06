"use strict";
const GraphicsApi_1 = require('./GraphicsApi');
const VisualStudioVersion_1 = require('./VisualStudioVersion');
const VrApi_1 = require('./VrApi');
exports.Options = {
    precompiledHeaders: false,
    intermediateDrive: '',
    graphicsApi: GraphicsApi_1.GraphicsApi.Direct3D9,
    vrApi: VrApi_1.VrApi.None,
    visualStudioVersion: VisualStudioVersion_1.VisualStudioVersion.VS2013,
    compilation: true,
    compile: false,
    run: false
};
//# sourceMappingURL=Options.js.map