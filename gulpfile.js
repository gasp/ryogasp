var gulp = require('gulp');
var less = require('gulp-less');

gulp.task('default', function() {
	// place code for your default task here
});

gulp.task('less', function () {
	return gulp.src('./src/squelettes/css/journal/style.less')
		.pipe(less())
		.pipe(gulp.dest('./src/squelettes/css/journal/'));
});
