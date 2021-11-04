const electron = require('electron');
const fs = require('fs');
const path = require('path');

let blobId = 0;
let blobRequests = {};

electron.ipcRenderer.on('blob-loaded', (event, args) => {
	const blobRequest = blobRequests[args.id];
	delete blobRequests[args.id];
	blobRequest.done(new Uint8Array(args.data));
});

electron.ipcRenderer.on('blob-failed', (event, args) => {
	const blobRequest = blobRequests[args.id];
	delete blobRequests[args.id];
	blobRequest.failed({url: args.url, error: args.error});
});

electron.contextBridge.exposeInMainWorld(
	'electron', {
		{Expose}
		showWindow: (title, x, y, width, height) => {
			if (electron.webFrame.setZoomLevelLimits != null) { // TODO: Figure out why this check is sometimes required
				electron.webFrame.setZoomLevelLimits(1, 1);
			}
			const options = {
				title: title,
				x: x,
				y: y,
				width: width,
				height: height,
			};
			electron.ipcRenderer.send('show-window', options);
		},
		loadBlob: (desc, done, failed) => {
			const options = {
				file: desc.files[0],
				id: blobId++
			};
			blobRequests[options.id] = {
				done: done,
				failed: failed
			};
			electron.ipcRenderer.send('load-blob', options);
		}
	}
);
