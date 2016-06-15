var gulp 			= require('gulp');
var filter 			= require('gulp-filter');
var mainBowerFiles 	= require('main-bower-files');


gulp.task('bower:js', function() {

    const fillterJS = filter('**/*.js', { restore: true });
    gulp.src(mainBowerFiles())
        .pipe(fillterJS)
        .pipe(gulp.dest('assets/js'));

});

gulp.task('bower:fonts', function() {

    const fillterJS = filter('**/*.js', { restore: true });
    gulp.src(mainBowerFiles())
        .pipe(fillterJS)
        .pipe(gulp.dest('assets/js'));

});



gulp.task('bower', ['bower:js']);