"use strict";

var webpage = require('webpage');
var page = webpage.create();
var system = require('system');
var options = JSON.parse(phantom.args[0]);

var log = console.log;

// ??
console.log = console.error = function () {
	system.stderr.writeLine([].slice.call(arguments).join(' '));
}

function fail (msg) {
	console.error(msg);
	return phantom.exit(1);
}

phantom.onError = function (msg, trace) {
	var msgStack = ['PHANTOM ERROR: ' + msg];
	if (trace && trace.length) {
		msgStack.push('TRACE:');
		trace.forEach(function (t) {
			msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
		});
	}

	fail(msgStack.join('\n'));
};

page.zoomFactor = options.zoomFactor || 1;

// Swallow page errors because we don't care
page.onError = function () {};

var requestTimeout = setTimeout(function () {
	fail('Request timeout.');
}, options.timeout * 1000);

page.onResourceReceived = function () {
	page.injectJs('./node_modules/es5-shim/es5-shim.js');
};

page.viewportSize = {
	width: options.width,
	height: options.height
};

if (options.crop) {
	page.clipRect = {
		top: 0,
		left: 0,
		width: options.width,
		height: options.height
	};
}

page.open(options.uri, function (status) {
	clearTimeout(requestTimeout);

	if (status === 'fail') {
		return fail('Couldn\'t load url ' + options.uri);
	}

	if (options.selector) {
		var clipRect = page.evaluate(function (selector) {
			var el = document.querySelector(selector);
			return (el) ? el.getBoundingClientRect() : null;

		}, options.selector);

		if (!clipRect) {
			return fail('Couldn\'t find element by selector');
		}

		page.clipRect = clipRect;
	}

	page.evaluate(function () {
		var background = window.getComputedStyle(document.body).getPropertyValue('background-color');
		if (!background || background === 'rgba(0, 0, 0, 0)') {
			document.body.style.backgroundColor = 'white';
		}
	});

	window.setTimeout(function () {
		log.call(console, page.renderBase64('png'));
		phantom.exit(0);
	}, options.delay * 1000);

});
