"use strict";

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var url = require('url');

var Base64Decode = require('base64-stream').Decode;
var fileUrl = require('file-url');
var merge = require('merge');
var objectHash = require('object-hash');
var phantomjs = require('phantomjs').path;
var viewports = require('viewportsizes');

exports = module.exports = shashin;

var defaults = {
	phantomTimeout: 300,
	timeout: 30,
	https: false,
	delay: 0,
	crop: false,
	selector: null,
	zoomFactor: 1
};

function shashin (uri, resolution, options, callback) {
	var task = prepareTask(merge(true,
		defaults,
		{ uri: uri, resolution: resolution },
		options
	));

	return merge(info(task), { stream: takeScreenshot(task) });
}

function info (task) {
	console.log(task);
	var info = {
		hash: objectHash(task),
		url: task.uri,
		width: task.width,
		height: task.height,
		crop: task.crop,
		delay: task.delay,
		selector: task.selector,
		zoomFactor: task.zoomFactor
	};
	console.log(info);

	return info;
}

function takeScreenshot (task) {
	var stream = new Base64Decode();
	var err = validateTask(task);

	if (err) {
		process.nextTick(function () {
			stream.emit('error', err);
			stream.end();
		});

	} else {

		var proc = spawn(phantomjs, [
			path.join(__dirname, 'phantom-screenshot.js'),
			JSON.stringify(task),
			'--ignore-ssl-errors=true',
			'--ssl-protocol=any',
			'--local-to-remote-url-access=true'
		]);

		proc.stdout.pipe(stream);

		var killTimer = setTimeout(function () {
			stream.emit('error', new Error('Process timed out'));
			stream.end();
			proc.kill();
		}, task.phantomTimeout * 1000);

		proc.stderr.on('data', function (data) {
			stream.emit('error', new Error(data.toString('utf8').trim()));
			stream.end();
		});

		proc.on('exit', function (code) {
			clearTimeout(killTimer);
		});
	}

	return stream;
}

function prepareTask (task) {
	var isFile = fs.existsSync(task.uri);
	var protocol = task.https ? 'https://' : 'http://';

	if (isFile) {
		task.uri = fileUrl(task.uri);
	} else {
		task.uri = (!task.uri) ? '' : url.parse(task.uri).protocol ? task.uri : protocol + task.uri;
	}

	task = merge(task, parseSize(task.resolution));

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

		task = merge(task, {
			width: newWidth,
			height: newHeight,
			zoomFactor: newWidth / resolution.width
		});
	}

	return task;
}

function validateTask (task) {
	var uriParts = url.parse(task.uri);

	if (!uriParts.protocol || !uriParts.host) {
		return new Error('Invalid argument: Missing or invalid URL.');
	}

	if (!task.width || !task.height) {
		return new Error('Invalid argument: Missing or invalid resoultion.');
	}

	if (task.timeout > task.phantomTimeout) {
		return new Error('Invalid options: phantomTimeout must be greater than timeout.');
	}

	if (task.delay > task.timeout) {
		return new Error('Invalid options: timeout must be greater than delay.');
	}
}

function parseSize (size) {
	if (size && typeof size === 'string') {
		if (/^\d+x\d+$/i.test(size)) {
			size = size.split(/x/i);
		} else {
			var vp = viewports.get(size);
			size = (vp) ? vp.size || null : null;
		}
	}

	if (size && Array.isArray(size) && size.length === 2) {
		return { width: parseInt(size[0], 10), height: parseInt(size[1], 10) };
	}

	if (size && typeof size === 'object' && size.hasOwnProperty('width') && size.hasOwnProperty('height')) {
		return size;
	}

	return null;
}
