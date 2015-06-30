var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var notify = require('gulp-notify');
var changed = require('gulp-changed');
var sftp = require('gulp-sftp');
var handleErrors = require('../util/handleErrors');
var _ = require('lodash');

var sftpOptions = require('../../sftp-credentials.js');

var dest = 'sftp-build';

gulp.task('sftp-publish', ['build'], function() {
  return gulp.src('./build/**')
  .pipe(gulp.dest(dest))
  .on("error", notify.onError("Error: <%= error.message %>"))
  .pipe(sftp(sftpOptions))
  .on("error", notify.onError("Error: <%= error.message %>"))
  .pipe(notify());
});
