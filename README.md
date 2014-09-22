![shashin](./artwork/logo.png)
==============================

[![Build Status](https://secure.travis-ci.org/maxkueng/shashin.png?branch=master)](http://travis-ci.org/maxkueng/shashin)

**shashin** _(japanese: photograph)_ takes beautiful photos of websites in any
resolution using PhantomJS.  
It is heavily inspired by [pageres](https://github.com/sindresorhus/pageres) but
shashin has a much simpler API.

## Install

```bash
npm install shashin --save
```

## API

## Sample usage

```javascript
var fs = require('fs');
var shashin = require('shashin');

var info = shashin('google.com', '1024x768', { delay: 1, crop: true });
var file = fs.createWriteStream('screenshot.png');

// Don't forget to handle errors
info.stream.on('error', function (err) {
  console.error(err);
});

info.stream.pipe(file);
```

### `info = shashin(url, resolution, options)`

#### url

Either a full URL to the website, just a domain name, or a local file path.

#### resoluton

A string like "1024x768" that represents the browser window size, or an array
with 2 entries like `[1024,768]`, or an object like `{ width: 1024, height:
768}`, or any device identifier supported by
[viewportsizes](https://www.npmjs.org/package/viewportsizes) (see
[viewportsizes.com](http://viewportsizes.com/))


#### options

##### delay

Type: `number`  
Default: `0`

Delay in seconds before taking the screenshot after the page has loaded.

##### crop

Type: `boolean`  
Default: `false`

If true the screenshot will be cropped to the viewport size.

##### selector

Type: `string`  
Default: `null`

A CSS selector to capture only a specific DOM element.

##### zoomFactor

Type: `number`  
Default: `1`

Zoom factor of the page, zoom factor is zoom percent / 100, so 2 represents 200%.

##### timeout

Tye: `number`  
Default: `30`

Number of seconds until the request times out.

##### phantomTimeout

Tye: `number`  
Default: `30`

Number of seconds until the PhantomJS process is killed in case it hangs.

##### https

Type: `boolean`  
Default: `false`

If true uses SSL/TLS protocol if not present in the `url`.

#### Return

Returns an object with all the necessary information to identify the 
screenshot and retreive the image data:

##### hash

Type: `string`

A hash of the internal instructions. Useful for file names or caching.

##### url

Type: `string`

The full URL to the captured site.

##### width

Type: `number`

Viewport width in pixels.

##### height

Type: `number`

Viewport height in pixels.

##### crop

Type: `boolean`

Whether the image was cropped.

##### delay

Type: `number`

Delay in seconds.

##### selector

Type: `string`

CSS selector used to capture a specific element.

##### zoomFactor

Type: `number`

The zoom factor.

##### stream

Type: `Class: stream.Readable`

A [readable
stream](http://nodejs.org/api/stream.html#stream_class_stream_readable_1) that
provides the binary image data in PNG format.
