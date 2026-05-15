const { from, of, EMPTY } = require('rxjs')
const { map, mapTo, tap, filter, mergeMap, delay, reduce } = require('rxjs/operators')
const Documents = require('@shared/Documents')
const TMDB = require('@shared/services/TMDB')
const Plex = require('@shared/services/Plex')
const chalk = require('chalk')

async function pairwise({ log, sensorr, db }) {
  log('')

  return await new Promise(resolve => {
    if (sensorr.config.plex && sensorr.config.plex.token) {
      const plex = new Plex(sensorr.config.plex)
      const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })

      log(`📺 `, `Looking for owned movies on ${chalk.inverse(plex.url)} Plex server ...`)
      log('')

      from(plex.client.query('/library/sections')).pipe(
        mergeMap(payload => from(payload.MediaContainer.Directory.filter((directory) => directory.type === 'movie' || directory.type === 'show'))),
        mergeMap(section => plex.client.query(`/library/sections/${section.key}/all`)),
        tap(payload => log('🎞️ ', `Found ${chalk.bold(payload.MediaContainer.Metadata.length)} ${payload.MediaContainer.title1 || 'items'} available on Plex server`)),
        tap(() => log('')),
        mergeMap(payload => from(payload.MediaContainer.Metadata)),
        mergeMap(payload => from(plex.client.query(payload.key)).pipe(
          map(payload => payload.MediaContainer.Metadata.pop().guid),
          map(guid => guid.split('://').reduce(
            (acc, curr, index, arr) => ['com.plexapp.agents.imdb', 'com.plexapp.agents.themoviedb'].includes(arr[0]) ?
            { agent: arr[0], id: arr[1].split('?').shift() } :
            null
          )),
          filter(guid => guid),
          tap(guid => log('🔗 ', `Handle ${chalk.bold(JSON.stringify(guid))} guid from Plex server`)),
          mergeMap(guid => of(guid).pipe(
            mergeMap(guid => {
              if (guid.agent === 'com.plexapp.agents.themoviedb') {
                return from(db.movies.find({ selector: { id: { $eq: guid.id } } }).pipe(
                  map(result => ({ type: 'movie', doc: result.docs.length ? result.docs[0] : null })),
                  mergeMap(({ doc }) => doc ? of({ type: 'movie', doc }) :
                    from(db.series.find({ selector: { id: { $eq: guid.id } } })).pipe(
                      map(result => ({ type: 'series', doc: result.docs.length ? result.docs[0] : null }))
                    )
                  )
                ))
              } else {
                return of({ type: 'movie', doc: null })
              }
            }),
            mergeMap(({ type, doc }) => !doc ?
              of({ type, guid }).pipe(
                tap(({ type, guid }) => log('📭', `Missing ${chalk.inverse('TMDB')} ${type} ${chalk.gray(guid.id)}`)),
                mergeMap(({ type, guid }) => type === 'series' ?
                  from(tmdb.getSeriesDetails(guid.id)).pipe(
                    map(payload => new Documents.Series({ ...payload, state: 'following' }).normalize()),
                    mergeMap(series => from(db.series.upsert(series.id, (doc) => ({ ...doc, ...series }))).pipe(mapTo(series))),
                    delay(2000),
                    tap(series => log('📼', `Series ${chalk.inverse(series.title)} added from Plex`)),
                  ) :
                  of(guid).pipe(
                    mergeMap(guid => ({
                      'com.plexapp.agents.themoviedb': of(guid.id),
                      'com.plexapp.agents.imdb': from(tmdb.fetch(['find', guid.id], { external_source: 'imdb_id' })).pipe(
                        mergeMap(payload => {
                          if (!payload.movie_results.length) {
                            log('📭', `Sorry, no result for IMDB movie ${chalk.gray(guid.id)}`)
                            return EMPTY
                          }
                          return of(payload.movie_results.pop().id)
                        }),
                      ),
                    }[guid.agent])),
                    mergeMap(id => tmdb.fetch(['movie', id], { append_to_response: 'alternative_titles,release_dates' })),
                    map(entity => new Documents.Movie({ ...entity, state: 'archived' }, sensorr.config.region).normalize()),
                    mergeMap(movie => from(db.movies.upsert(movie.id, (doc) => ({ ...doc, ...movie }))).pipe(mapTo(movie))),
                    delay(2000),
                    tap(movie => log('📼', `Movie ${chalk.inverse(movie.title)} which is available on Plex server, will now be ${chalk.gray('archived')} on Sensorr`)),
                  )
                ),
              ) : (type === 'series' ?
                of(doc).pipe(
                  tap(series => log('📼', `Series ${chalk.inverse(series.title)} already synced from Plex`)),
                ) :
                (doc.state === 'archived' ?
                  of(doc).pipe(
                    tap(movie => log('📼', `Movie ${chalk.inverse(movie.title)} already ${chalk.gray('archived')} on Sensorr`)),
                  ) :
                  from(db.movies.upsert(doc._id, (doc) => ({ id: doc._id, ...doc, ...doc, time: Date.now(), state: 'archived' }))).pipe(
                    mapTo(doc),
                    tap(movie => log('📼', `Movie ${chalk.inverse(movie.title)} which is available on Plex server, will now be ${chalk.gray('archived')} on Sensorr`)),
                  )
                )
              )
            ),
          )),
          delay(200),
        ), null, 1),
        reduce((acc, movie) => [...acc, movie], []),
        mergeMap(movies => db.movies.find({
          selector: {
            $and: [
              { id: { $nin: movies.map(movie => movie.id) } },
              { state: { $eq: 'archived' } },
            ],
          }
        })),
        mergeMap(movies => from(movies.docs)),
        mergeMap(movie => from(db.movies.upsert(movie._id, (doc) => ({ id: movie._id, ...movie, ...doc, time: Date.now(), state: 'missing' }))).pipe(
          mapTo(movie),
          tap(movie => log('💊', `Movie ${chalk.inverse(movie.title)} which is not available anymore on Plex server, will now be ${chalk.gray('missing')} on Sensorr`)),
          delay(200),
        ), null, 1),
      ).subscribe(
        () => {},
        (err) => {
          log('🚨', err)
          resolve()
        },
        () => {
          log('')
          resolve()
        },
      )
    } else {
      log('🚨', 'Missing token, are you sure Plex server is connected with your Sensorr instance ?')
      log('')
      resolve()
    }
  })
}

module.exports = pairwise
