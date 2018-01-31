if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 8.9 && process.version !== 'v7.4.0' /* Kode Studio 17.9 */) {
	console.error('Requires Node.js version 8.9 or higher but found ' + process.version + '.');
	process.exit(1);
}

require('./out/khamake.js');
