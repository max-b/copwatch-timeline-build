var fs = require('fs');
var gulp = require('gulp');
var notify = require('gulp-notify');
var changed = require('gulp-changed');
var sftp = require('gulp-sftp');
var handleErrors = require('../util/handleErrors');
var _ = require('lodash');

var sftpOptions = require('../../sftp-credentials.js');

var dest = 'sftp-build';

gulp.task('sftp-publish-watch', ['watch'], function() {
  return gulp.src('./build/**')
    .pipe(changed(dest)) // Ignore unchanged files
    .pipe(sftp(sftpOptions))
    .on("error", notify.onError("Error: <%= error.message %>"))
    .pipe(gulp.dest(dest))
    .on("error", notify.onError("Error: <%= error.message %>"))
    .pipe(notify());
});
