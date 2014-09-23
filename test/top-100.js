/**
 * shashin should never crash or throw so we test it against Wikipedia's 
 * list of 100 most popular websites. It may not be able to capture all 
 * of them due to reasons like unavailability and such but it should 
 * never crash or throw.
 */

var test = require('tape');
var shashin = require('../index');
var fs = require('fs');
var path = require('path');
var async = require('async');
var wrappy = require('wrappy');

var once = wrappy(function (callback) {
	var called = false
	return function () {
		if (called) { return; }
		called = true
		return callback.apply(this, arguments);
	}
});

var domains = fs.readFileSync(path.join(__dirname, 'resources', 'top-100.txt'), { encoding: 'utf-8' });
domains = domains.split(/\r?\n/);

var settings = [
	{ resolution: 'iphone 6', options: { crop: true, delay: 2 } },
	{ resolution: '1024x768', options: { crop: false, delay: 1 } },
	{ resolution: 'nexus 7', options: { crop: true, delay: 0 } },
	{ resolution: [ 800, 600 ], options: { crop: true, delay: 2 } }
];

var q = async.queue(takeScreenshot, 100);

domains.forEach(q.push);

function takeScreenshot (domain, next) {
	var setting = randomSetting();

	test(domain, function (t) {

		var info = shashin(domain, setting.resolution, settings.options);
		var filePath = path.join(__dirname, info.hash + '.png');

		var error = null;;

		info.stream.on('error', once(function (err) {
			error = err;
		}));

		var file = fs.createWriteStream(filePath);

		file.on('finish', function () {
			var stat = fs.statSync(filePath);

			if (!error) {
				t.ok(stat.size > 0, 'file as expected');
			} else {
				t.equal(stat.size, 0, 'file as expected', error);
				fs.unlinkSync(filePath);
			}


			t.end();
			next();
		});

		info.stream.pipe(file);


	});
}

function randomSetting () {
	return settings[Math.floor(Math.random() * settings.length)];
}
