"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins');
var mainBowerFiles = require('main-bower-files');


gulp.task('bower:js', function() {

    const fillterJS = $.filter('**/*.js', { restore: true });
    gulp.src(mainBowerFiles())
        .pipe(fillterJS)
        .pipe(gulp.dest('assets/js'));

});


gulp.task('bower', ['bower:js']);
