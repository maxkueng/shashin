var express = require('express');
var http = require('http');

exports = module.exports = function (port, timeout) {
	var app = express();

	app.get('/test/normal', function (req, res) {
		res.type('html');
		res.send('<!DOCTYPE html>\n<html><body><div id="test" style="width: 400px; height:300px; margin: 100px auto; background-color: #f00; ">HELLO</div></body></html>');
	});

	app.get('/test/lag', function (req, res) {
		var lag = parseInt(req.param('lag'));
		setTimeout(function () {
			res.send({ lag: 3 });
		}, lag * 1000);
	});

	app.get('/test/slow', function (req, res) {
		var lag = parseInt(req.param('lag'));

		var interval = setInterval(function () {
			res.write(String(Math.random()));
		}, 100);

		setTimeout(function () {
			clearInterval(interval);
			res.end('\n');
		}, lag * 1000);
	});

	app.get('/test/long', function (req, res) {
		res.type('html');

		res.write('<!DOCTYPE html>\n<html>\n<body>\n');
		for (i = 0; i < 100; i++) {
			res.write('<div style="width: 400px; height:300px; margin: 10px auto; background-color: #f00; ">HELLO</div>\n');
		}
		res.write('</html>\n</body>');

		res.end('\n');
	});

	var server = http.createServer(app);
	server.listen(port);

	var close = server.close;

	server.close = function () {
		try {
			close.call(server);
		} catch (e) {
		}
	};

	if (timeout) {
		setTimeout(function () {
			server.close();
		}, timeout * 1000);
	}

	return server;
};
