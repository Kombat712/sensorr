const { from, of, EMPTY } = require('rxjs')
const { mergeMap, map, pluck, filter, tap, catchError } = require('rxjs/operators')
const TMDB = require('@shared/services/TMDB')
const { Series } = require('@shared/Documents')
const chalk = require('chalk')

async function checkEpisodes({ log, sensorr, db }) {
  const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })

  return await new Promise(resolve =>
    from(db.series.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(rows => rows.map(row => ({ id: row.id, ...row.doc }))),
      mergeMap(series => from(series.filter(s => s.state === 'following'))),
      mergeMap(series => of(series).pipe(
        mergeMap(series => tmdb.getSeriesDetails(series.id)),
        map(details => new Series({ ...series, ...details }).normalize()),
        mergeMap(series => from((series.seasons || []).reduce((acc, season) => ([...acc, ...(season.episodes || []).map(ep => ({ ...ep, season_number: season.season_number }))]), [])).pipe(
          filter(ep => ep.status === 'aired'),
          filter(ep => !(series.watched || {})[`${ep.season_number}:${ep.episode_number}`]),
          tap(ep => log('🆕', `${chalk.inverse(series.title)} new episode S${String(ep.season_number).padStart(2,'0')}E${String(ep.episode_number).padStart(2,'0')}`)),
        )),
        mergeMap(() => from(db.series.upsert(series.id, (doc) => ({ ...doc, ...series, time: Date.now() })))),
        catchError(() => EMPTY),
      ), null, 1),
    ).subscribe(() => {}, () => resolve(), () => resolve())
  )
}

module.exports = checkEpisodes
