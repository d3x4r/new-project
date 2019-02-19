import gulp from 'gulp';
import del from 'del';
import autoprefixer from 'autoprefixer';
import include from 'posthtml-include';
import browserSync from 'browser-sync';
import plumber from 'gulp-plumber';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import csso from 'gulp-csso';
import posthtml from 'gulp-posthtml';
import w3cjs from 'gulp-w3cjs';

import htmlmin from 'gulp-htmlmin';
import imagemin from 'gulp-imagemin';
import svgstore from 'gulp-svgstore';

import rename from 'gulp-rename';
import webp from 'gulp-webp';

import sourcemaps from 'gulp-sourcemaps';
import rollup from 'gulp-better-rollup';
import babel from 'rollup-plugin-babel';
import uglify from 'gulp-uglify';

import normalize from 'node-normalize-scss';
import rev from 'gulp-rev-append';

const server = browserSync.create();

gulp.task('rev', () => gulp.src('build/*.html')
  .pipe(rev())
  .pipe(gulp.dest('build')));

gulp.task('html', () => gulp.src('source/*.html')
  .pipe(posthtml([
    include(),
  ]))
  .pipe(w3cjs())
  .pipe(htmlmin({
    collapseWhitespace: true,
    removeComments: true,
  }))
  .pipe(gulp.dest('build')));

gulp.task('htmlValid', () => gulp.src('build/*.html')
  .pipe(w3cjs()));

gulp.task('css', () => gulp.src('source/sass/style.scss')
  .pipe(plumber())
  .pipe(sass({
    includePaths: normalize.includePaths,
  }))
  .pipe(postcss([
    autoprefixer({
      browsers: [
        'last 2 versions',
        'IE 11',
        'Firefox ESR',
      ],
    }),
  ]))
  .pipe(csso())
  .pipe(gulp.dest('build/css'))
  .pipe(server.stream()));

gulp.task('clean', () => del('build'));

gulp.task('copy', () => gulp.src([
  'source/fonts/**/*.{woff,woff2}',
  'source/img/*',
  'source/js/lib/*',
  'source/pixelglass/**/*',
  '!source/img/sprite',
  '!source/img/original',
], {
  base: 'source',
})
  .pipe(gulp.dest('build')));

gulp.task('images', () => gulp.src('source/img/original/*.{png,jpg,svg}')
  .pipe(imagemin([
    imagemin.optipng({ optimizationLevel: 3 }),
    imagemin.jpegtran({ progressive: true }),
    imagemin.svgo({
      plugins: [
        { removeViewBox: false },
      ],
    }),
  ]))
  .pipe(gulp.dest('source/img')));

gulp.task('sprite', () => gulp.src('source/img/sprite/*.svg')
  .pipe(svgstore({
    inlineSvg: true,
  }))
  .pipe(rename('sprite.svg'))
  .pipe(gulp.dest('build/img')));

gulp.task('webp', () => gulp.src('source/img/original/*.jpg')
  .pipe(webp({ quality: 90 }))
  .pipe(gulp.dest('source/img')));

gulp.task('js', () => gulp.src('source/js/main.js')
  .pipe(sourcemaps.init())
  .pipe(rollup({
    plugins: [babel()],
  }, {
    format: 'iife',
  }))
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('build/js')));

gulp.task('server', () => {
  server.init({
    server: 'build/',
  });

  gulp.watch('source/sass/**/*.{scss,sass}', gulp.series('css', 'refresh'));
  gulp.watch('source/img/sprite/*.svg', gulp.series('sprite', 'html', 'refresh'));
  gulp.watch('source/*.html', gulp.series('html', 'refresh'));
  gulp.watch('source/img/*', gulp.series('copy', 'refresh'));
  gulp.watch('source/img/original', gulp.series('images', 'webp', 'refresh'));
  gulp.watch('source/js/lib.js', gulp.series('copy', 'refresh'));
  gulp.watch('source/js/*.js', gulp.series('js', 'refresh'));
  gulp.watch('source/js/*', gulp.series('copy', 'refresh'));
});

gulp.task('refresh', (done) => {
  server.reload();
  done();
});

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel(
    'copy',
    'css',
  ),
  gulp.parallel(
    'sprite',
  ),
  gulp.parallel(
    'html',
    'js',
  ),
));

gulp.task('start', gulp.series(
  'clean',
  gulp.parallel(
    'copy',
    'css',
  ),
  'sprite',
  gulp.parallel(
    'html',
    'js',
  ),
  'server',
));
