"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: true });
var child = require('child_process');
var config = require('../config')();


gulp.task('jekyll', () => {

    var jekyll_exe = process.platform === "win32" ? "jekyll.bat" : "jekyll";
    var jekyll = child.spawn(jekyll_exe, ['build',
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


var browserSync = require('browser-sync').create();

gulp.task('server', () => {

	$.util.log(config.site);

    browserSync.init({
        files: [config.site.root + '/**'],
        port: 4000,
        server: {
            baseDir: config.site.root
        }
    });

    gulp.watch(config.src.css + '**/*.?(s)css', ['css']);
});


gulp.task('start', ['css', 'jekyll', 'server']);
