var gulp = require('gulp');

var mainBowerFiles = require('main-bower-files');


gulp.task('bower',function(){

   gulp.src(mainBowerFiles()).pipe(gulp.dest('assets/js'));

});
