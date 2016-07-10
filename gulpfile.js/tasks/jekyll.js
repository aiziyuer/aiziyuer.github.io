"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var child = require('child_process');
var config = require('../config')();


gulp.task('jekyll:server', () => {

    var jekyll_exe = process.platform === "win32" ? "jekyll.bat" : "jekyll";
    var jekyll = child.spawn(jekyll_exe, ['server',
        '--watch',
        '--incremental'
    ]);

    var jekyllLogger = (buffer) => {
        buffer.toString()
            .split(/\n/)
            .forEach((message) => $.util.log('Jekyll: ' + message));
    };

    jekyll.stdout.on('data', jekyllLogger);
    jekyll.stderr.on('data', jekyllLogger);


});


gulp.task('css', () => {

    gulp.src(config.src.scss + '/**/*.?(s)css')
        .pipe($.print())
        .pipe($.sass())
        .pipe($.concat('style.css'))
        .pipe($.print())
        .pipe(gulp.dest(config.src.css));
});


var browserSync = require('browser-sync').create();

gulp.task('server', () => {

    browserSync.init({
        files: [config.siteRoot + '/**'],
        port: 4000,
        server: {
            baseDir: config.siteRoot
        }
    });
});


gulp.task('start', ['server']);
