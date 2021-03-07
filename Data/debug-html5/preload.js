const electron = require("electron");

electron.contextBridge.exposeInMainWorld(
	'electron', {
		showWindow: (title, x, y, width, height) => {
			if (electron.webFrame.setZoomLevelLimits != null) { // TODO: Figure out why this check is sometimes required
				electron.webFrame.setZoomLevelLimits(1, 1);
			}
			const options = {
				type: 'showWindow',
				title: title,
				x: x,
				y: y,
				width: width,
				height: height,
			}
			electron.ipcRenderer.send('asynchronous-message', options);
		}
	}
);
