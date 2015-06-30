var changed    = require('gulp-changed');
var gulp       = require('gulp');
var notify     = require('gulp-notify');

gulp.task('bower', function() {
	var dest = './build/bower_components/';

	return gulp.src('./bower_components/*/dist/**')
		.pipe(changed(dest)) // Ignore unchanged files
		.pipe(gulp.dest(dest))
    .pipe(notify());
});
