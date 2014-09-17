"use strict";

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var url = require('url');

var phantomjs = require('phantomjs').path;
var assign = require('object-assign');
var base64 = require('base64-stream');
var fileUrl = require('file-url');

exports = module.exports = rescap;

var defaults = {
	phantomTimeout: 300000,
	timeout: 30,
	https: false,
	delay: 0,
	crop: false,
	selector: null,
	zoomFactor: 1
};

function rescap (uri, resolution, options, callback) {
	var task = assign(defaults, { uri: uri, resolution: resolution }, options);
	task = prepareTask(task);

	var stream = takeScreenshot(task);

	return assign(task, { stream: stream });
}

function prepareTask (task) {
	var isFile = fs.existsSync(task.uri);
	var protocol = task.https ? 'https://' : 'http://';

	if (isFile) {
		task.uri = fileUrl(task.uri);
	} else {
		task.uri = url.parse(task.uri).protocol ? task.uri : protocol + task.uri;
	}

	task = assign(task, parseSize(task.resolution));

	if (task.size) {
		var size = parseSize(task.size);
		var resolution = parseSize(task.resolution);
		var aspect = resolution.width / resolution.height;
		var newWidth, newHeight;

		if (aspect > 1) {
			newWidth = size.width;
			newHeight = resolution.height / aspect;
		} else {
			newWidth = resolution.width * aspect;
			newHeight = size.height;
		}

		task = assign(task, {
			width: newWidth,
			height: newHeight,
			zoomFactor: newWidth / resolution.width
		});

		console.log(task);
	}

	return task;
}

function takeScreenshot (task) {
	var proc = spawn(phantomjs, [
		path.join(__dirname, 'phantom-screenshot.js'),
		JSON.stringify(task),
		'--ignore-ssl-errors=true',
		'--ssl-protocol=any',
		'--local-to-remote-url-access=true'
	]);

	var stream = proc.stdout.pipe(base64.decode());

	var killTimer = setTimeout(function () {
		stream.emit('error', new Error('Process timed out'));
		proc.kill();
	}, options.phantomTimeout);

	proc.stderr.on('data', function (data) {
		stream.emit('error', new Error(data));
	});

	proc.on('exit', function (code) {
		clearTimeout(killTimer);
	});

	return stream;
}

function parseSize (size) {
	if (typeof size === 'string' && /^\d+x\d+$/i.test(size)) {
		var size = size.split(/x/i);
	}

	if (Array.isArray(size) && size.length === 2) {
		return { width: size[0], height: size[1] };
	}

	if (typeof size === 'object' && size.hasOwnProperty('width') && size.hasOwnProperty('height')) {
		return size;
	}

	return null;
}
