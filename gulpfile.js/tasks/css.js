"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var config = require('../config')();


gulp.task('css', () => {

    gulp.src(config.src.scss + '/**/*.?(s)css')
        .pipe($.print())
        .pipe($.sass())
        .on('error', (err) => {
        	// 这里捕获异常, 只是打印错误日志, 不会终止css任务
            $.util.log(err);
        })
        .pipe($.concat('style.css'))
        .pipe($.print())
        .pipe(gulp.dest(config.src.css));
});
