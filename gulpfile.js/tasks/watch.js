"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var config = require('../config')();


gulp.task('watch:css', () => {

    $.util.log('watch:css');
    gulp.watch(config.src.scss + '**/*.?(s)css', ['css']);

});


gulp.task('watch', ['watch:css']);
