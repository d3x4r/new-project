import gulp from 'gulp';

import htmlmin from 'gulp-htmlmin';
import posthtml from 'gulp-posthtml';
import include from 'posthtml-include';

import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import csso from 'gulp-csso';
import autoprefixer from 'autoprefixer';
import normalize from 'node-normalize-scss';

import del from 'del';
import rename from 'gulp-rename';

import webp from 'gulp-webp';
import imagemin from 'gulp-imagemin';
import imageminPngquant from 'imagemin-pngquant';
import svgstore from 'gulp-svgstore';

import rollup from 'gulp-better-rollup';
import babel from 'rollup-plugin-babel';

import uglify from 'gulp-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import inject from 'rollup-plugin-inject';
import sourcemaps from 'gulp-sourcemaps';

import plumber from 'gulp-plumber';
import browserSync from 'browser-sync';

const server = browserSync.create();

gulp.task('html', () => gulp.src('source/*.html')
  .pipe(posthtml([
    include(),
  ]))
  .pipe(htmlmin({
    collapseWhitespace: true,
    removeComments: true,
  }))
  .pipe(gulp.dest('build')));

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
  'source/img/**/*',
  'source/js/lib/*',
  'source/pixelglass/**/*',
  '!source/img/sprite/*',
  '!source/img/sprite',
], {
  base: 'source',
})
  .pipe(gulp.dest('build')));

gulp.task('sprite', () => gulp.src('source/img/sprite/*.svg')
  .pipe(svgstore({
    inlineSvg: true,
  }))
  .pipe(rename('sprite.svg'))
  .pipe(gulp.dest('build/img')));

gulp.task('js', () => gulp.src('source/js/main.js')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(rollup({
    plugins: [
      inject({
        include: '**/*.js',
        exclude: 'node_modules/**',
        $: 'jquery',
      }),
      commonjs(),
      nodeResolve(),
      babel(),
    ],
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
  gulp.watch('source/*.html', gulp.series('html', 'refresh'));
  gulp.watch('source/img/**/*', gulp.series('copy', 'sprite', 'html', 'refresh'));
  gulp.watch('source/js/**/*', gulp.series('js', 'refresh'));
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


// Таски для отпимизации изображений, использование через - npx gulp webp *taskname*
gulp.task('webp', () => gulp.src('build/img/**/*.jpg')
  .pipe(webp({ quality: 90 }))
  .pipe(gulp.dest('build/img')));

gulp.task('images', () => gulp.src('build/img/**/*.{png,jpg,svg}')
  .pipe(imagemin([
    imageminPngquant({ quality: [0.6, 0.8] }),
    imagemin.jpegtran({ progressive: true }),
    imagemin.svgo({
      plugins: [
        { removeViewBox: false },
      ],
    }),
  ]))
  .pipe(gulp.dest('build/img')));

gulp.task('svg', () => gulp.src('build/img/**/*.svg')
  .pipe(imagemin([
    imagemin.svgo({
      plugins: [
        { removeViewBox: false },
      ],
    }),
  ]))
  .pipe(gulp.dest('build/img')));
