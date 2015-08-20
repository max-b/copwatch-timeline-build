var browserify   = require('browserify');
var argv         = require('yargs').argv
var gulp         = require('gulp');
var gulpif      = require('gulp-if');
var uglify       = require('gulp-uglify');
var notify       = require('gulp-notify');
var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var sourcemaps   = require('gulp-sourcemaps');
var cssify       = require('cssify');

var hbsfy = require('hbsfy').configure({
  extensions: ['html']
});

console.log('ARGV DEV: ' + argv.dev);

gulp.task('browserify', ['images', 'less'], function(){
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: ['./src/javascript/app.js'],
    debug: true,
    // defining transforms here will avoid crashing your stream
    transform: [hbsfy, cssify]
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulpif(!argv.dev, uglify()))
    .on("error", notify.onError("Error: <%= error.message %>"))
    .pipe(gulpif(argv.dev, sourcemaps.init({loadMaps: true})))
    .on("error", notify.onError("Error: <%= error.message %>"))
    .pipe(gulpif(argv.dev, sourcemaps.write('./')))
    .on("error", notify.onError("Error: <%= error.message %>"))
    .pipe(gulp.dest('./build/'))
    .pipe(notify());
});
	
