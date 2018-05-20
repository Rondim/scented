var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function (request, response) { });
server.listen(1337, function () { 
	console.log((new Date()) + ' Server is listening on port 1337');
});

ws = new WebSocketServer({
	httpServer: server
});

var clients = [];
var state = {
	strokes: []
};

function handleMessage(message) {
	if (!message)
		return;

	var p = message.p;

	switch (message.o) {
		case "deleteAll": {
			state.strokes = [];
			break;
		}
		case "deleteStroke": { 
			for (var i = state.strokes.length - 1; i >= 0; --i) {
				if (state.strokes[i].id !== p.id) continue;
				
				state.strokes.splice(i, 1);
				break;
			}
			break;
		}
		case "points": {
			if (p.isNewStroke === true) {
				var stroke = { id: p.id, points: p.points, color: p.color };
				if (p.isFinished === true) stroke.isFinished = true;
				
				state.strokes.push(stroke);
			} else {
				for (var i = state.strokes.length - 1; i >= 0; --i) {
					if (state.strokes[i].id !== p.id) continue;
					
					var stroke = state.strokes[i];
					stroke.points.push(...p.points);

					if (p.isFinished === true) stroke.isFinished = true;

					break;
				}
			}
			break;
		}
	}
}

// WebSocket server
ws.on('request', function (request) {
	var connection = request.accept(null, request.origin);
	console.log((new Date()) + ' Connection accepted');
	console.log('Pushed to clients as number ' + (clients.push(connection) - 1));
	
    connection.sendUTF(JSON.stringify({ o: "serverState", p: state }));

	connection.on('message', function (message) {
		if (message.type === 'utf8') {
			//console.log('Received Message: ' + message.utf8Data);

			//process
			var json = JSON.parse(message.utf8Data);

			handleMessage(json);

			//broadcast
			clients.forEach(function (value) {
				if (connection == value)
					return;
				
				value.sendUTF(message.utf8Data);
			});
		}
		else if (message.type === 'binary') {
			console.log('Received binary (?)');
		}
	});

	connection.on('close', function (reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected');

		var index = clients.findIndex(value => value == connection);
		
		if (index >= 0) {
			console.log('Client number ' + index + ' dropped');
			clients.splice(index, 1);
		}
	});
});