"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var config = require('../config')();


var browserSync = require('browser-sync').create();

gulp.task('server', ['css'], () => {

	$.util.log(config.site);

    browserSync.init({
        files: [config.site.root + '/**'],
        port: 3131,
        server: {
            baseDir: config.site.root
        }
    });

   
});