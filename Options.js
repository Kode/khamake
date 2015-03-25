var GraphicsApi = require('./GraphicsApi.js');
var VisualStudioVersion = require('./VisualStudioVersion.js');
var VrApi = require('./VrApi.js');

module.exports = {
	precompiledHeaders: false,
	intermediateDrive: '',
	graphicsApi: GraphicsApi.Direct3D9,
	vrApi: VrApi.None,
	visualStudioVersion: VisualStudioVersion.VS2013,
	compilation: true,
	compile: false,
	run: false
};
