var gulp    = require('gulp');
var clean   = require('gulp-clean');
var notify  = require('gulp-notify');

gulp.task('clean', ['clean-sftp'], function() {
	return gulp.src('build', {read: false})
		.pipe(clean())
    .pipe(notify());
});
