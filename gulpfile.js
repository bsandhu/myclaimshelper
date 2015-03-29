/**
 * Running: On command line: gulp
 * Docs:
 *  http://travismaynard.com/writing/getting-started-with-gulp
 *  http://markgoodyear.com/2014/01/getting-started-with-gulp/
 */

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var tsc = require('gulp-typescript');
var shell = require('gulp-shell');
var concat = require('gulp-concat');
//var typescript = require('gulp-tsc');
var ts = require('gulp-typescript');
var clean = require('gulp-clean');
var del = require('del');
var merge = require('merge2');


var paths = {
    tscripts: {
        src: [
            'client/app/model/*.ts',
            'client/app/utils/*.ts',
            'client/lib/**/*.ts'
        ],
        dest: 'build/app'
    },
    buildDir : 'build'
};

// Runs if no task is specified
gulp.task('default', ['run']);

// Run Node
gulp.task('run', ['build'], shell.task([
    'node ./server/start.js'
]));

// Watch Files For Changes
gulp.task('watch', function () {
    gulp.watch(paths.tscripts.src, ['build']);
});

// Build
gulp.task('build', ['compile:typescript']);

gulp.task('clean', function(){
    del([paths.buildDir])
})

// TypeScript cross compile
gulp.task('compile:typescript', function () {
    gulp.src(['client/**/*.*'])
        .pipe(gulp.dest(paths.buildDir));

//    gulp.src(paths.tscripts.src)
//        .pipe(typescript({module: 'amd'}))
//        .pipe(gulp.dest(paths.tscripts.dest))

    var tsResult =
        gulp.src(paths.tscripts.src)
            .pipe(ts({
                declarationFiles: true,
                noExternalResolve: true,
                target: 'ES6',
                module: 'amd'
            }))
    return tsResult.js.pipe(gulp.dest(paths.buildDir))
});

// Lint Task
gulp.task('lint', function () {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});