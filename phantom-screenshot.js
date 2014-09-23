"use strict";

var webpage = require('webpage');
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

renderPage(options);

function renderPage (options) {
	var page = webpage.create();

	var redirectURL = null;

	var requestTimeout = setTimeout(function () {
		fail('Request timeout.');
	}, options.timeout * 1000);

	page.zoomFactor = options.zoomFactor || 1;

	if (options.username && options.password) {
		page.customHeaders = { Authorization: 'Basic ' + btoa(options.username + ':' + options.password) };
	}

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

	// Swallow page errors because we don't care
	page.onError = function () {};

	page.onResourceReceived = function (resource) {
		var sameURL = (options.uri === resource.url);
		var isRedirect = (String(resource.status)[0] === '3' && resource.redirectURL);

		if (sameURL && isRedirect) {
			redirectURL = resource.redirectURL;
			return;
		}

		page.injectJs('./node_modules/es5-shim/es5-shim.js');
	};

	page.open(options.uri, function (status) {
		clearTimeout(requestTimeout);

		if (redirectURL) {
			options.uri = redirectURL;
			return renderPage(options);
		}

		if (status !== 'success') {
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

}
