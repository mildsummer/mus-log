var gulp = require('gulp'),
    babelify = require('babelify'),
    sass = require('gulp-sass'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    concat = require('gulp-concat'),
    autoprefix = require('gulp-autoprefixer'),
    cssmin = require('gulp-cssmin');

//gulp.task('concat', function() {
//    return gulp.src(['./build/javascripts/jquery.mousewheel.min.js', './build/javascripts/jquery.easing.1.3.js', './build/javascripts/preloadjs-NEXT.min.js', './build/javascripts/main.js'])
//      .pipe(concat('infographic.js'))
//      .pipe(gulp.dest('./build/assets/javascripts'));
//});

gulp.task('browserify', function() {
    browserify({
        entries: './source/javascripts/main.js',
        debug: true
    })
        .transform(babelify)
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('./public/javascripts'));
});
//
//gulp.task('server', function() {
//    gulp.src('./build/')
//        .pipe(server({
//            livereload: true,
//            open: true
//    }));
//});

//gulp.task('html', function () {
//    gulp.src('./source/*.html')
//        .pipe(gulp.dest('./build/'));
//});

gulp.task('sass', function () {
    gulp.src('./source/sass/*.scss')
        .pipe(sass({includePaths: ['./styles'],
                    errLogToConsole: true}))
        .pipe(autoprefix("last 1 version",
            "> 1%", "ie 8", "ie 7", { cascade: true }))
        .pipe(cssmin())
        .pipe(gulp.dest('./public/stylesheets'));
});

//gulp.task('watch', ['sass', 'browserify'], function () {
//    gulp.watch(['./source/javascripts/*.js'], ['browserify']);
//    gulp.watch(['./source/sass/*.scss'], ['sass']);
//});

gulp.task('default', ['sass', 'browserify']);