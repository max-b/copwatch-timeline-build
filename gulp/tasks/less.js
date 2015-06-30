var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var notify = require('gulp-notify');

gulp.task('less', function () {
  return gulp.src('./src/less/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./build/css'))
    .pipe(notify());
});
