var gulp       = require('gulp');

gulp.task('watch', ['build'], function() {
	gulp.watch('src/html/**', ['build-html']);
	gulp.watch('src/templates/**', ['build']);
	gulp.watch('lib/**', ['json-conversion']);
	gulp.watch('src/less/**', ['less']);
	gulp.watch('src/images/**', ['images']);
	gulp.watch('build/**', ['sftp-publish-watch']);
});
