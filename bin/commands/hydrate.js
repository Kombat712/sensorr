const { from, of, EMPTY } = require('rxjs')
const { map, mapTo, tap, mergeMap, delay, pluck, catchError } = require('rxjs/operators')
const { Movie, Star, Series } = require('@shared/Documents')
const TMDB = require('@shared/services/TMDB')
const chalk = require('chalk')

async function hydrate({ log, sensorr, db }) {
  const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })

  log('')
  await new Promise(resolve =>
    from(db.movies.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(entities => entities.map(entity => ({ id: entity.id, ...entity.doc }))),
      tap(movies => movies.length ? '' : log('🧐', `Oh. It seems your movies collection is empty.`)),
      map(movies => movies.sort((a, b) => a.time - b.time)),
      mergeMap(movies => from(movies)),
      mergeMap(movie => of(movie).pipe(
        mergeMap(movie => tmdb.fetch(['movie', movie.id], { append_to_response: 'credits,alternative_titles,release_dates' })),
        map(details => new Movie({ ...movie, ...details }, sensorr.config.region || 'en-US').normalize()),
        mergeMap(movie => from(db.movies.upsert(movie.id, (doc) => ({ ...doc, ...movie }))).pipe(mapTo(movie))),
        catchError(err => {
          log('🚨', err.toString())
          return EMPTY
        }),
        delay(2000),
      ), null, 1),
    ).subscribe(
      (movie) => log(
        '💧 ',
        'Hydrating',
        `movie data ${chalk.inverse(movie.title)} ${chalk.gray(`(${movie.year})`)}`,
      ),
      (err) => log('🚨', err),
      () => {
        log('')
        resolve()
      },
    )
  )


  log('')
  await new Promise(resolve =>
    from(db.series.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(entities => entities.map(entity => ({ id: entity.id, ...entity.doc }))),
      tap(series => series.length ? '' : log('📺', `No series to hydrate.`)),
      map(series => series.sort((a, b) => a.time - b.time)),
      mergeMap(series => from(series)),
      mergeMap(item => of(item).pipe(
        mergeMap(item => tmdb.getSeriesDetails(item.id)),
        map(details => new Series({ ...item, ...details }).normalize()),
        mergeMap(series => from(db.series.upsert(series.id, (doc) => ({ ...doc, ...series, time: Date.now() }))).pipe(mapTo(series))),
        catchError(err => {
          log('🚨', err.toString())
          return EMPTY
        }),
        delay(1000),
      ), null, 1),
    ).subscribe(
      (series) => log('💧 ', 'Hydrating', `series data ${chalk.inverse(series.title)}`),
      (err) => log('🚨', err),
      () => { log(''); resolve() },
    )
  )

  log('')
  return await new Promise(resolve =>
    from(db.stars.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(entities => entities.map(entity => ({ id: entity.id, ...entity.doc }))),
      tap(stars => stars.length ? '' : log('🧐', `Oh. It seems you're not stalking anyone.`)),
      map(stars => stars.sort((a, b) => a.time - b.time)),
      mergeMap(stars => from(stars)),
      mergeMap(star => of(star).pipe(
        mergeMap(star => tmdb.fetch(['person', star.id], { append_to_response: 'images,movie_credits' })),
        map(details => new Star({ ...star, ...details }).normalize()),
        mergeMap(star => from(db.stars.upsert(star.id, (doc) => ({ ...doc, ...star }))).pipe(mapTo(star))),
        catchError(err => {
          log('🚨', err.toString())
          return EMPTY
        }),
        delay(2000),
      ), null, 1),
    ).subscribe(
      (star) => log(
        '💧 ',
        'Hydrating',
        `star data ${chalk.inverse(star.name)} - ${star.known_for_department} ${chalk.gray(`(${star.birthday})`)}`,
      ),
      (err) => log('🚨', err),
      () => {
        log('')
        resolve()
      },
    )
  )
}

module.exports = hydrate
