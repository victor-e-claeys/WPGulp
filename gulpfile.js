/**
 * Gulpfile.
 *
 * Gulp with WordPress.
 *
 * Implements:
 *      1. Live reloads browser with BrowserSync.
 *      2. CSS: Sass to CSS conversion, error catching, Autoprefixing, Sourcemaps,
 *         CSS minification, and Merge Media Queries.
 *      3. JS: Concatenates & uglifies Vendor and Custom JS files.
 *      4. Images: Minifies PNG, JPEG, GIF and SVG images.
 *      5. Watches files for changes in CSS or JS.
 *      6. Watches files for changes in PHP.
 *      7. Corrects the line endings.
 *      8. InjectCSS instead of browser page reload.
 *      9. Generates .pot file for i18n and l10n.
 *
 * @author Ahmad Awais (@ahmadawais)
 * @version 1.0.3
 */

/**
 * Load Configuration
 *
 * Load gulp file configuration from yml file
 */
var read = require('read-yaml');
const config = read.sync('gulpfile.config.yml');

/**
 * Load Plugins.
 *
 * Load gulp plugins and passing them semantic names.
 */
var gulp         = require('gulp'); // Gulp of-course

// CSS related plugins.
var sass         = require('gulp-sass'); // Gulp pluign for Sass compilation.
var minifycss    = require('gulp-uglifycss'); // Minifies CSS files.
var autoprefixer = require('gulp-autoprefixer'); // Autoprefixing magic.
var mmq          = require('gulp-merge-media-queries'); // Combine matching media queries into one media query definition.

// JS related plugins.
var concat       = require('gulp-concat'); // Concatenates JS files
var uglify       = require('gulp-uglify'); // Minifies JS files

// Image realted plugins.
var imagemin     = require('gulp-imagemin'); // Minify PNG, JPEG, GIF and SVG images with imagemin.

// Utility related plugins.
var rename       = require('gulp-rename'); // Renames files E.g. style.css -> style.min.css
var lineec       = require('gulp-line-ending-corrector'); // Consistent Line Endings for non UNIX systems. Gulp Plugin for Line Ending Corrector (A utility that makes sure your files have consistent line endings)
var filter       = require('gulp-filter'); // Enables you to work on a subset of the original files by filtering them using globbing.
var sourcemaps   = require('gulp-sourcemaps'); // Maps code in a compressed file (E.g. style.css) back to it’s original position in a source file (E.g. structure.scss, which was later combined with other css files to generate style.css)
var notify       = require('gulp-notify'); // Sends message notification to you
var browserSync  = require('browser-sync').create(); // Reloads browser and injects CSS. Time-saving synchronised browser testing.
var reload       = browserSync.reload; // For manual browser reload.
var wpPot        = require('gulp-wp-pot'); // For generating the .pot file.
var sort         = require('gulp-sort'); // Recommended to prevent unnecessary changes in pot-file.
var path         = require('path');
var multidest    = require('gulp-multi-dest');
var zip          = require('gulp-zip'); 
var jshint       = require('gulp-jshint');
var stylish      = require('jshint-stylish');


function getPath(string){
  string = string.replace('**/', '');
  return string.substring(0, string.lastIndexOf('/') + 1 );
}


/**
 * Task: `directories`.
 *
 * Creates directories (if required) from config
 *
 */
gulp.task('directories', function(){
  var paths = [
    config.translation.dest,
    config.style.src,
    config.style.dest,
    config.js.custom.src,
    config.js.custom.dest,
    config.js.vendor.src,
    config.js.vendor.dest,
    config.img.src,
    config.img.dest,
  ];
  paths.forEach(function(path,i){
    paths[i] = getPath(path);
  });
  return gulp.src('*.*', {read: false})
    .pipe(multidest(paths))
    .pipe( notify( { message: 'TASK: "directories" Completed! 💯', onLast: true } ) );
});


/**
 * Task: `browser-sync`.
 *
 * Live Reloads, CSS injections, Localhost tunneling.
 *
 * This task does the following:
 *    1. Sets the project URL
 *    2. Sets inject CSS
 *    3. You may define a custom port
 *    4. You may want to stop the browser from openning automatically
 */
gulp.task( 'browser-sync', function() {
  browserSync.init( {

    // For more options
    // @link http://www.browsersync.io/docs/options/

    // Project URL.
    proxy: config.project.url,

    // `true` Automatically open the browser with BrowserSync live server.
    // `false` Stop the browser from automatically opening.
    open: true,

    // Inject CSS changes.
    // Commnet it to reload browser for every CSS change.
    injectChanges: true,

    // Use a specific port (instead of the one auto-detected by Browsersync).
    // port: 7000,

  } );
});


/**
 * Task: `styles`.
 *
 * Compiles Sass, Autoprefixes it and Minifies CSS.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    3. Writes Sourcemaps for it
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix .min.css
 *    6. Minifies the CSS file and generates style.min.css
 *    7. Injects CSS or reloads the browser via browserSync
 */
 gulp.task('styles', function () {
    gulp.src( config.style.src )
    .pipe( sourcemaps.init() )
    .pipe( sass( {
      errLogToConsole: true,
      outputStyle: 'compact',
      // outputStyle: 'compressed',
      // outputStyle: 'nested',
      // outputStyle: 'expanded',
      precision: 10
    } ) )
    .on('error', console.error.bind(console))
    .pipe( sourcemaps.write( { includeContent: false } ) )
    .pipe( sourcemaps.init( { loadMaps: true } ) )
    .pipe( autoprefixer( config.autoprefix ) )

    .pipe( sourcemaps.write ( './' ) )
    .pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
    .pipe( gulp.dest( config.style.dest ) )

    .pipe( filter( '**/*.css' ) ) // Filtering stream to only css files
    .pipe( mmq( { log: true } ) ) // Merge Media Queries only for .min.css version.

    .pipe( browserSync.stream() ) // Reloads style.css if that is enqueued.

    .pipe( rename( { suffix: '.min' } ) )
    .pipe( minifycss( {
      maxLineLen: 10
    }))
    .pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
    .pipe( gulp.dest( config.style.dest ) )

    .pipe( filter( '**/*.css' ) ) // Filtering stream to only css files
    .pipe( browserSync.stream() )// Reloads style.min.css if that is enqueued.
    .pipe( notify( { message: 'TASK: "styles" Completed! 💯', onLast: true } ) )
 });


 /**
  * Task: `vendorJS`.
  *
  * Concatenate and uglify vendor JS scripts.
  *
  * This task does the following:
  *     1. Gets the source folder for JS vendor files
  *     2. Concatenates all the files and generates vendors.js
  *     3. Renames the JS file with suffix .min.js
  *     4. Uglifes/Minifies the JS file and generates vendors.min.js
  */
 gulp.task( 'vendorsJs', function() {
  gulp.src( config.js.vendor.src )
    .pipe( concat( config.js.vendor.file + '.js' ) )
    .pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
    .pipe( gulp.dest( config.js.vendor.dest ) )
    .pipe( rename( {
      basename: config.js.vendor.file,
      suffix: '.min'
    }))
    .pipe( uglify() )
    .pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
    .pipe( gulp.dest( config.js.vendor.dest ) )
    .pipe( notify( { message: 'TASK: "vendorsJs" Completed! 💯', onLast: true } ) );
 });


 /**
  * Task: `customJS`.
  *
  * Concatenate and uglify custom JS scripts.
  *
  * This task does the following:
  *     1. Gets the source folder for JS custom files
  *     2. Concatenates all the files and generates custom.js
  *     3. Renames the JS file with suffix .min.js
  *     4. Uglifes/Minifies the JS file and generates custom.min.js
  */
 gulp.task( 'customJS', function() {
    gulp.src( config.js.custom.src )
    .pipe( concat( config.js.custom.file + '.js' ) )
    .pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
    .pipe( jshint() )
    .pipe( jshint.reporter(stylish) )
    .pipe( gulp.dest( config.js.custom.dest ) )
    .pipe( rename( {
      basename: config.js.custom.file,
      suffix: '.min'
    }))
    .pipe( uglify() )
    .pipe( lineec() ) // Consistent Line Endings for non UNIX systems.
    .pipe( gulp.dest( config.js.custom.dest ) )
    .pipe( notify( { message: 'TASK: "customJs" Completed! 💯', onLast: true } ) );
 });


 /**
  * Task: `images`.
  *
  * Minifies PNG, JPEG, GIF and SVG images.
  *
  * This task does the following:
  *     1. Gets the source of images raw folder
  *     2. Minifies PNG, JPEG, GIF and SVG images
  *     3. Generates and saves the optimized images
  *
  * This task will run only once, if you want to run it
  * again, do it with the command `gulp images`.
  */
 gulp.task( 'images', function() {
  gulp.src( config.img.src )
    .pipe( imagemin( {
          progressive: true,
          optimizationLevel: 3, // 0-7 low-high
          interlaced: true,
          svgoPlugins: [{removeViewBox: false}]
        } ) )
    .pipe(gulp.dest( config.img.dest ))
    .pipe( notify( { message: 'TASK: "images" Completed! 💯', onLast: true } ) );
 });


 /**
  * WP POT Translation File Generator.
  *
  * * This task does the following:
  *     1. Gets the source of all the PHP files
  *     2. Sort files in stream by path or any custom sort comparator
  *     3. Applies wpPot with the variable set at the top of this file
  *     4. Generate a .pot file of i18n that can be used for l10n to build .mo file
  */
 gulp.task( 'translate', function () {
     return gulp.src( config.watch.php )
         .pipe(sort())
         .pipe(wpPot( {
             domain        : config.translation.text_domain,
             package       : config.translation.packageName,
             bugReport     : config.translation.bugReport,
             lastTranslator: config.translation.lastTranslator,
             team          : config.translation.team
         } ))
        .pipe(gulp.dest(  config.translation.dest + config.translation.file ))
        .pipe( notify( { message: 'TASK: "translate" Completed! 💯', onLast: true } ) )

 });


 /**
  * Watch Tasks.
  *
  * Watches for file changes and runs specific tasks.
  */
 gulp.task( 'default', ['directories', 'styles', 'vendorsJs', 'customJS', 'images', 'browser-sync'], function () {
  gulp.watch( config.watch.php, reload ); // Reload on PHP file changes.
  gulp.watch( config.watch.style, [ 'styles' ] ); // Reload on SCSS file changes.
  gulp.watch( config.watch.js.vendor, [ 'vendorsJs', reload ] ); // Reload on vendorsJs file changes.
  gulp.watch( config.watch.js.custom, [ 'customJS', reload ] ); // Reload on customJS file changes.
 });


 /**
  * Package task
  *
  * Creates a package in the 
  */
 gulp.task('package', function(){
   return gulp.src(config.package.files)
     .pipe(rename(function(file){
       file.dirname = config.package.filename + '/' + file.dirname
     }))
     .pipe(zip(config.package.filename + '.zip'))
     .pipe(gulp.dest(config.package.dest))
     .pipe( notify( { message: 'TASK: "package" Completed! 💯', onLast: true } ) );
 })