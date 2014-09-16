rescap
======

rescap takes screenshots of websites in any resolution using PhantomJS.
It is heavily inspired by
[pageres](https://github.com/sindresorhus/pageres) but tries to be
simpler.

## Example

```javascript
var fs = require('fs');
var rescap = require('rescap');

var info = rescap('google.com', '1024x768', { delay: 1, crop: true });
var file = fs.createWriteStream('screenshot.png');
info.stream.pipe(file);
```
