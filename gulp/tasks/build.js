var gulp = require('gulp');

gulp.task('build', ['images', 'less', 'build-html', 'browserify', 'json-conversion'], function(cb) {
  setTimeout(function () {
    cb();
  }, 1);
});
