var test = require('tape');
var shashin = require('../index');
var fs = require('fs');
var path = require('path');
var imageSize = require('image-size');
var wrappy = require('wrappy');
var ReadableStream = require('stream').Readable;

var once = wrappy(function (callback) {
	var called = false
	return function () {
		if (called) { return; }
		called = true
		return callback.apply(this, arguments);
	}
});

var server = require('./resources/server');

test('VALIDATION', function (t) {

	t.test('should emit error when URL is missing', function (tt) {
		tt.plan(1);
	
		var info = shashin(undefined, '1024x768');

		info.stream.on('error', once(function (err) {
			tt.ok(err instanceof Error, 'emits error');
		}));
	});

	t.test('should send error when resolution is invalid', function (tt) {
		tt.plan(1);
	
		var info = shashin('example.com', 'my ass', {});

		info.stream.on('error', once(function (err) {
			tt.ok(err instanceof Error, 'emits error');
		}));
	});

	t.test('should send error when delay is greater than timeout', function (tt) {
		tt.plan(1);
	
		var info = shashin('example.com', '1024x768', { delay: 40, timeout: 20 });

		info.stream.on('error', once(function (err) {
			tt.ok(err instanceof Error, 'emits error');
		}));
	});

	t.test('should send error when phantomTimeout is too low', function (tt) {
		tt.plan(1);
	
		var info = shashin('example.com', '1024x768', { timeout: 20, phantomTimeout: 10 });

		info.stream.on('error', once(function (err) {
			tt.ok(err instanceof Error, 'emits error');
		}));
	});

	t.test('should send error when URL couldn\'t be loaded', function (tt) {
		tt.plan(1);
	
		var info = shashin('exxxxxxxxxxxxxxxxample.com', '1024x768');

		info.stream.on('error', once(function (err) {
			tt.ok(err instanceof Error, 'emits error');
		}));
	});

});

test('OPTIONS', function (t) {

	t.test('timeout: should send error if request timed out', function (tt) {
		tt.plan(2);

		var startTime = +Date.now();
		var s = server(13371, 3);
	
		var info = shashin('http://localhost:13371/test/lag?lag=3', '1024x768', { timeout: 2 });

		info.stream.on('error', once(function (err) {
			var timeElapsed = Math.round((+Date.now() - startTime) / 1000);

			s.close();

			tt.ok(err instanceof Error, 'emits error');
			tt.equal(timeElapsed, 2, 'timeout is correct');
		}));

	});

	t.test('delay: should delay the capture', function (tt) {
		tt.plan(1);

		var delay = 2;
		var startTime = +Date.now();
		var s = server(13371, 4);
	
		var info = shashin('http://localhost:13371/test/normal', '1024x768', { delay: delay });

		info.stream.on('finish', function () {
			var timeElapsed = Math.round((+Date.now() - startTime) / 1000);

			s.close();

			tt.ok(timeElapsed >= delay, 'delay is correct');
		});
	});

	t.test('crop: should crop to resolution', function (tt) {
		tt.plan(2);

		var s = server(13371, 2);
		var filePath = 'test.png';
	
		var info = shashin('http://localhost:13371/test/long', '1024x768', { crop: true });

		var file = fs.createWriteStream(filePath);

		file.on('finish', function () {
			var dims = imageSize(filePath);
			tt.equal(dims.width, 1024, 'width ok');
			tt.equal(dims.height, 768, 'height ok');

			fs.unlinkSync(filePath);
		});

		info.stream.pipe(file);

		info.stream.on('finish', function () {
			s.close();
		});
	});

	t.test('crop: should capture the full page without crop', function (tt) {
		tt.plan(2);

		var s = server(13371, 4);
		var filePath = 'test.png';
	
		var info = shashin('http://localhost:13371/test/long', '1024x768');

		var file = fs.createWriteStream(filePath);

		file.on('finish', function () {
			var dims = imageSize(filePath);
			tt.equal(dims.width, 1024, 'width ok');
			tt.ok(dims.height > 768, 'height ok');

			fs.unlinkSync(filePath);
		});

		info.stream.pipe(file);

		info.stream.on('finish', function () {
			s.close();
		});
	});

	t.test('selector: should capture only the selected element', function (tt) {
		tt.plan(2);

		var s = server(13371, 2);
		var filePath = 'test.png';
	
		var info = shashin('http://localhost:13371/test/normal', '1024x768', { selector: '#test' });

		var file = fs.createWriteStream(filePath);

		file.on('finish', function () {
			var dims = imageSize(filePath);
			tt.equal(dims.width, 400, 'width ok');
			tt.equal(dims.height, 300, 'height ok');

			fs.unlinkSync(filePath);
		});

		info.stream.pipe(file);

		info.stream.on('finish', function () {
			s.close();
		});
	});

	t.test('selector: should send error if element not found', function (tt) {
		tt.plan(1);

		var s = server(13371, 3);
	
		var info = shashin('http://localhost:13371/test/normal', '1024x768', { selector: '#notexists' });

		info.stream.on('error', once(function (err) {
			s.close();

			tt.ok(err instanceof Error, 'emits error');
		}));

	});

	t.test('basic auth: should log in', function (tt) {
		tt.plan(1);

		var info = shashin('httpbin.org/basic-auth/hansel/gretel', '1024x768', { username: 'hansel', password: 'gretel' });

		info.stream.on('error', once(function (err) {
			tt.fail();
		}));

		info.stream.on('finish', function () {
			tt.ok(true);
		});
	});

	t.test('basic auth: should send an error with false credentials', function (tt) {
		tt.plan(1);

		var info = shashin('httpbin.org/basic-auth/hansel/gretel', '1024x768', { username: 'hansel', password: 'wrong' });

		info.stream.on('error', once(function (err) {
			tt.ok(err instanceof Error, 'emits error');
		}));
	});

});

test('GENERAL', function (t) {
	t.test('resolution: accept device names from viewportsizes.com', function (tt) {
		tt.plan(2);

		var info = shashin('httpbin.org/html', 'nexus 5');
		
		tt.equal(info.width, 360, 'width ok');
		tt.equal(info.height, 598, 'height ok');
	});

	t.test('resolution: accept device name with orientation', function (tt) {
		tt.plan(2);

		var info = shashin('httpbin.org/html', 'nexus 5@landscape');
		
		tt.equal(info.width, 598, 'width ok');
		tt.equal(info.height, 360, 'height ok');
	});

	t.test('resolution: string', function (tt) {
		tt.plan(2);

		var info = shashin('httpbin.org/html', '1024x768');
		
		tt.equal(info.width, 1024, 'width ok');
		tt.equal(info.height, 768, 'height ok');
	});

	t.test('resolution: object', function (tt) {
		tt.plan(2);

		var info = shashin('httpbin.org/html', { width: 1337, height: 4242 });
		
		tt.equal(info.width, 1337, 'width ok');
		tt.equal(info.height, 4242, 'height ok');
	});

	t.test('resolution: array', function (tt) {
		tt.plan(2);

		var info = shashin('httpbin.org/html', [ 400, 300 ]);
		
		tt.equal(info.width, 400, 'width ok');
		tt.equal(info.height, 300, 'height ok');
	});


	t.test('return value', function (tt) {
		tt.plan(9);

		var info = shashin('victorjs.org', 'nexus 5', { delay: 2, crop: true });
		
		tt.ok(info.hash, 'hash ok');
		tt.equal(info.url, 'http://victorjs.org/', 'url ok');
		tt.equal(info.width, 360, 'width ok');
		tt.equal(info.height, 598, 'height ok');
		tt.equal(info.crop, true, 'crop ok');
		tt.equal(info.delay, 2, 'delay ok');
		tt.equal(info.selector, null, 'selector ok');
		tt.equal(info.zoomFactor, 1, 'zoomFactor ok');
		tt.ok(info.stream instanceof ReadableStream, 'stream ok');
	});

	t.test('redirects: should follow redirects', function (tt) {
		var info = shashin('http://httpbin.org/relative-redirect/6', 'nexus 5');

		var filePath = info.hash + '.png'

		var file = fs.createWriteStream(filePath);

		info.stream.on('error', once(function (err) {
			tt.fail();
		}));

		info.stream.on('finish', function () {
			tt.end();
		});

		file.on('finish', function () {
			fs.unlinkSync(filePath);
		});

		info.stream.pipe(file);

	});

	t.test('local file: should render a local HTML file', function (tt) {
		var info = shashin('test/resources/test.html', 'nexus 5');

		var filePath = info.hash + '.png'

		var file = fs.createWriteStream(filePath);

		info.stream.on('error', once(function (err) {
			tt.fail();
		}));

		info.stream.on('finish', function () {
			tt.end();
		});

		file.on('finish', function () {
			fs.unlinkSync(filePath);
		});

		info.stream.pipe(file);

	});

});
