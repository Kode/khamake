'use strict';

const electron = require('electron');
const path = require('path');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

electron.ipcMain.on('asynchronous-message', (event, arg) => {
	if (arg.width && arg.height) mainWindow.setContentSize(arg.width, arg.height);
	if (arg.title) mainWindow.setTitle(arg.title);
	if (arg.x != -1 && arg.y != -1) {
		mainWindow.setPosition(arg.x, arg.y);
	}
	else {
		mainWindow.center();
	}
	mainWindow.show();
});

app.on('window-all-closed', function () {
	app.quit();
});

app.on('ready', function () {
	mainWindow = new BrowserWindow({
		width: {Width}, height: {Height},
		show: false, useContentSize: true, autoHideMenuBar: true,
		icon: app.getAppPath() + '/favicon' + {ext},
		webPreferences: {
			contextIsolation: true,
			preload: path.join(app.getAppPath(), 'preload.js')
		}
	});
	mainWindow.loadURL('file://' + app.getAppPath() + '/index.html');
	mainWindow.on('closed', function() {
		mainWindow = null;
	});
});
