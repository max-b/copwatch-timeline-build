var changed    = require('gulp-changed');
var gulp       = require('gulp');
var notify     = require('gulp-notify');

gulp.task('build-html', function() {
	var dest = './build';

	return gulp.src('./src/html/**')
		.pipe(changed(dest)) // Ignore unchanged files
		.pipe(gulp.dest(dest))
    .pipe(notify());
});
