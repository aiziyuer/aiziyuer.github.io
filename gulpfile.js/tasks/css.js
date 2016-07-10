"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var config = require('../config')();


gulp.task('css', () => {

    gulp.src(config.src.scss + '/**/*.?(s)css')
        .pipe($.print())
        .pipe($.sass())
        .pipe($.concat('style.css'))
        .pipe($.print())
        .pipe(gulp.dest(config.src.css));
});