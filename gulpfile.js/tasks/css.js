"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({lazy: true});
var config = require('../config')();
var path = require('path');


gulp.task('css', () => {

    gulp.src(config.src.scss + '/**/*.?(s)css')
        .pipe($.print())
        .pipe($.compass({
            // debug: true,
            config_file: 'config.rb',
            project: config.src.root,
            sass: '_sass'
        }))
        .on('error', (err) => {
            // 这里捕获异常, 只是打印错误日志, 不会终止css任务
            $.util.log(err);
        })
        .pipe($.concat('style.css'))
        .pipe($.print())
        .pipe(gulp.dest(config.src.css));

});
