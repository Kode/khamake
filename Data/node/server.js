const port = 9876;
const playersPerSession = 2;

const child_process = require('child_process');
const express = require('express');
app = express();
require('express-ws')(app);

app.use('/', express.static('../html5'));

app.use((err, req, res, next) => {
	console.error(err.stack);
});

class Session {
	constructor() {
		this.clients = [];
		this.instance = child_process.fork('./kha.js');
		this.instance.on('message', (message) => {
			this.clients[message.id].send(message);
		});
	}
}

let sessions = [];
let pendingSession = new Session();

app.ws('/', (socket, req) => {
	console.log('Client connected.');

	socket.session = pendingSession;
	socket.id = socket.session.clients.length;
	socket.session.clients.push(socket);
	socket.session.instance.send({message: 'connect', id: socket.id});
	
	socket.on('message', function (message) {
		socket.session.instance.send({message: 'message', data: message, id: socket.id});
	});
	
	socket.onclose = () => {
		console.log('Removing client ' + socket.id + '.');
		socket.session.instance.send({message: 'disconnect', id: socket.id});
		socket.session.clients.remove(socket);
		if (socket.session.clients.length === 0) {
			socket.session.instance.kill();
			sessions.remove(socket.session);
		}
	};
	
	if (pendingSession.clients.length === playersPerSession) {
		console.log('Starting session.');
		pendingSession.instance.send({message: 'start'});
		sessions.push(pendingSession);
		pendingSession = new Session();
	}
});

console.log('Starting server at ' + port + '.');
app.listen(port);
