var gulp       = require('gulp');
var clean   = require('gulp-clean');
var notify   = require('gulp-notify');

// We could probably do this within clean.js 
// but I'm being a little lazy - maxb
gulp.task('clean-sftp', function() {
  console.log("cleaning sftp");
	return gulp.src('sftp-build', {read: false})
		.pipe(clean())
    .pipe(notify());
});
