var gulp = require('gulp');

gulp.task('build', ['images', 'build-html', 'json-conversion'], function(cb) {
  setTimeout(function () {
    cb();
  }, 1);
});
