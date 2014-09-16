rescap
======

rescap takes screenshots of websites in any resolution using PhantomJS.
It is heavily inspired by
[pageres](https://github.com/sindresorhus/pageres) but tries to be
simpler.

# API

### info = rescap(url, resolution, options)

**url**

Either a full URL to the website, just a domain name, or a local file path.

**resoluton**

A string like "1024x768" that represents the browser window size, or an
array with 2 entries like `[1024,768]`, or an object like 
`{ width: 1024, height: 768}`.


**options**

`delay` (number, default: 0): Delay in seconds before taking the screenshot after the page has loaded.  
`crop` (boolean, default: false): If true the screenshot will be cropped to the viewport size.  
`selector` (string, default: null): A CSS selector to capture only a specific DOM element.  
`zoomFactor` (number, default: 1): Zoom factor of the page, zoom factor is zoom percent / 100, so 2 represents 200%.  
`timeout` (number, default: 30): Number of seconds until the request times out.  
`https` (boolean, default: false): If true uses SSL/TLS protocol if not present in the `url`.  

## Example

```javascript
var fs = require('fs');
var rescap = require('rescap');

var info = rescap('google.com', '1024x768', { delay: 1, crop: true });
var file = fs.createWriteStream('screenshot.png');
info.stream.pipe(file);
```
