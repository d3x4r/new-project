'use strict';

var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var getGulpPlugin = gulpLoadPlugins();

var del = require("del");
var autoprefixer = require("autoprefixer");
var include = require("posthtml-include");
var pump = require("pump");
var server = require("browser-sync").create();

gulp.task('css', function () {
  return gulp.src('source/sass/style.scss')
    .pipe(getGulpPlugin.plumber())
    .pipe(getGulpPlugin.sass({
      includePaths: require('node-normalize-scss').includePaths
    }))
    .pipe(getGulpPlugin.postcss([
      autoprefixer()
    ]))
    .pipe(getGulpPlugin.csso())
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(getGulpPlugin.posthtml([
      include()
    ]))
    .pipe(getGulpPlugin.w3cjs())
    .pipe(getGulpPlugin.htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {
  return del("build");
});

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/*",
    '!source/img/sprite'
  ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

gulp.task("images", function () {
  return gulp.src("source/img/*.{png,jpg,svg}")
    .pipe(getGulpPlugin.imagemin([
      getGulpPlugin.imagemin.optipng({ optimizationLevel: 3 }),
      getGulpPlugin.imagemin.jpegtran({ progressive: true }),
      getGulpPlugin.imagemin.svgo({
        plugins: [
          { removeViewBox: false }
        ]
      })
    ]))
    .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function () {
  return gulp.src("source/img/*.svg")
    .pipe(getGulpPlugin.svgstore({
      inlineSvg: true
    }))
    .pipe(getGulpPlugin.rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

gulp.task("webp", function () {
  return gulp.src("source/img/*.{png,jpg}")
    .pipe(getGulpPlugin.webp({ quality: 90 }))
    .pipe(gulp.dest("build/img"));
});

gulp.task("js", function (cb) {
  pump([
    gulp.src("source/js/*.js"),
    getGulpPlugin.uglify(),
    gulp.dest("build/js")
  ],
    cb
  );
});

gulp.task("server", function () {
  server.init({
    server: "build/"
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css"));
  gulp.watch("source/img/sprite/*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
  gulp.watch("source/js/*.js", gulp.series("js", "refresh"));
});

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("build", gulp.series(
  "clean",
  gulp.parallel(
    "copy",
    "css"
    ),
  gulp.parallel(
    "images",
    "sprite",
    ),
  gulp.parallel(
    "webp",
    "html",
    "js"
    )
));

gulp.task("start", gulp.series(
  "clean",
  gulp.parallel(
    "copy",
    "css"
    ),
  "sprite",
  gulp.parallel(
    "html",
    "js"
    ),
  "server"
));
