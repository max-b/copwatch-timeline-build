var changed    = require('gulp-changed');
var source    = require('vinyl-source-stream');
var stream    = require('stream');
var gulp       = require('gulp');
var notify     = require('gulp-notify');
var gulpWait = require('gulp-wait');
var config     = require('../../config.js');
var Q = require('q');
var gutil = require('gulp-util');

var swallowErrors = require('../util/swallowErrors');
var urlRequest = config.spreadsheetUrl;

gulp.task('json-conversion', function() {
	var dest = './build';

  var deferred = Q.defer();
  delete require.cache[require.resolve('../../lib/json-conversion.js')]
  var convertJson = require('../../lib/json-conversion.js');

  try {
    convertJson(urlRequest).then(function(result) {

      try {
        var resultStream = new stream.Readable();
        resultStream._read = function noop() {}; // redundant? see update below
        resultStream.push(JSON.stringify(result));
        resultStream.push(null);

        resultStream.pipe(source('timeline_data.json'))
                          .pipe(gulp.dest(dest))
                          .pipe(gulpWait(1500)) // hopefully allows images to be finished
                          .pipe(notify());
                          
        deferred.resolve();
      } catch (e) {
        console.log('error: ' + e.stack);
      }
    });
  } catch (e) {
    console.log('error: ' + e.stack);
  }

  return deferred.promise;
});
