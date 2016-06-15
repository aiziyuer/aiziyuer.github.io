
var gulp 		= require('gulp');
var taskListing = require('gulp-task-listing');
var util		= require('gulp-util'); 

var helpTask = function(){

//util.log(taskListing());
taskListing();

};

gulp.task('help', helpTask)
module.exports = helpTask