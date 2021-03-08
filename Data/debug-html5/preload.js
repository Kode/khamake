const electron = require("electron");
const fs = require('fs');
const path = require('path');

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
		},
		loadBlob: (desc, done, failed) => {
			let url = null;
			if (path.isAbsolute(desc.files[0])) {
				url = desc.files[0];
			}
			else {
				url = path.join(__dirname, desc.files[0]);
			}
			fs.readFile(url, function(err, data) {
				if (err != null) {
					failed({url: url, error: err});
					return;
				}

				done(new Uint8Array(data));
			});
		}
	}
);
