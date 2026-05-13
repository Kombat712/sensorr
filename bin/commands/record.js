const fs = require('fs')
const filenamify = require('filenamify')
const { from, of, throwError, bindNodeCallback, EMPTY } = require('rxjs')
const { map, mapTo, tap, filter, mergeMap, delay, pluck, catchError } = require('rxjs/operators')
const TMDB = require('@shared/services/TMDB')
const { Movie, Series } = require('@shared/Documents')
const filesize = require('@shared/utils/filesize')
const uuidv4 = require('uuid/v4')
const chalk = require('chalk')
const Plex = require('@shared/services/Plex')

async function record({ argv, log, session, logger, sensorr, db }) {
  const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })
  const plex = (sensorr.config.plex && (sensorr.config.plex.token || sensorr.config.plex.url)) ? new Plex(sensorr.config.plex) : null
  logger.init()

  if (sensorr.config.disabled) {
    log('⛔', 'Record job disabled by user !')
    log('')
    return
  }

  return await new Promise(resolve =>
    from(db.movies.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(entities => entities.map(entity => ({ id: entity.id, ...entity.doc }))),
      tap(movies => movies.filter(movie => ['wished', 'missing'].includes(movie.state)).length ? '' : log('👏', 'Up to date, no more wished movies !')),
      map(movies => movies.sort((a, b) => a.time - b.time)),
      mergeMap(movies => from(movies)),
      filter(movie => ['wished', 'missing'].includes(movie.state)),
      mergeMap(movie => {
        const record = uuidv4()
        const context = { session, record }

        return of(movie).pipe(
          mergeMap(movie => tmdb.fetch(['movie', movie.id], { append_to_response: 'credits,alternative_titles,release_dates' })),
          map(details => new Movie({ ...movie, ...details }, sensorr.config.region || 'en-US').normalize()),
          mergeMap(movie => from(db.movies.upsert(movie.id, (doc) => ({ ...doc, ...movie }))).pipe(mapTo(movie))),
          mergeMap(movie => look(movie, context)),
          mergeMap(({ movie, release }) => grab(movie, release, context)),
          map(values => ({ ...values, context })),
          catchError(err => {
            log('🚨', err.toString())
            logger.error(`🚨 Error during **${movie.title}** (${movie.year}) recording`, { context, movie, err }, err)
            return EMPTY
          }),
          delay(2000),
        )
      }, null, 1),

      mergeMap(() => from(db.series.allDocs({ include_docs: true })).pipe(
        pluck('rows'),
        map(rows => rows.map(entity => ({ id: entity.id, ...entity.doc }))),
        mergeMap(series => from(series)),
        filter(series => ['following'].includes(series.state)),
        mergeMap(series => recordSeries(series), null, 1),
      ), null, 1),
    ).subscribe(
      ({ movie, release, file, context }) => {
        log(
          '📼',
          'Archiving',
          `movie ${chalk.inverse(movie.title)} ${chalk.gray(`(${movie.year})`)}`,
          'with',
          `release ${chalk.inverse(release.title)}`,
          'to',
          chalk.gray(file)
        )

        logger.spawn(
          `📼 Archiving movie **${movie.title}** ${`(${movie.year})`} with release **${release.title}** to _${file}_`,
          { context, release, file, done: true },
        )
      },
      (err) => log('🚨', err),
      () => {
        log('')
        resolve()
      },
    )
  )

  function look(movie, context = {}) {
    log('')
    log('🍿', `Looking for wished movie ${chalk.inverse(movie.title)} ${chalk.gray(`(${movie.year})`)}`)
    logger.input(`🍿 Looking for wished movie **${movie.title}** (${movie.year})`, { context, movie })

    const hooks = {
      search: (xznab, title) => {
        log('🔫 ', `Looking for ${chalk.bold(title)} on ${chalk.underline(xznab.name)} XZNAB`)
        logger.fetch(`🔫 Looking for **${title}** on **${xznab.name}** XZNAB`, { context, xznab, title })
      },
      timeout: (xznab, title) => {
        log('⌛ ', `Request for ${chalk.bold(title)} on ${chalk.underline(xznab.name)} XZNAB timed out ! Retrying...`)
        logger.fetch(`⌛ Request for **${title}** on **${xznab.name}** XZNAB timed out ! Retrying...`, { context, xznab, title })
      },
      found: (xznab, title, items) => {
        log('🎞️ ', `Found ${chalk.bold(items.length)} releases`)
        logger.receive(`🎞️ Found **${items.length}** releases` , { context, xznab, title, items })
      },
      release: (xznab, title, release) => {
        log('*', chalk[['green', 'yellow', 'red'][release.warning]](release.title), chalk.gray(release.valid ? `(${release.score})` : release.reason))
        logger.receive(`- ${['**', '**_', '~~'][release.warning]}${release.title}${['**', '_**', '~~'][release.warning]} _${(release.valid ? `(${release.score})` : release.reason)}_`, { context, xznab, title, release })
      },
      sorted: (releases) => {
        if (releases.length) {
          log('🚧', `Filtering and ordering ${releases.length} releases`, chalk.gray(`[${sensorr.config.sort}]`), { true: '🔻', false: '🔺' }[sensorr.config.descending])
          logger.finish(`🚧 Filtering and ordering **${releases.length}** releases [${sensorr.config.sort}] ${{ true: '🔻', false: '🔺' }[sensorr.config.descending]}`, { context, releases, sort: sensorr.config.sort, descending: sensorr.config.descending })
        } else {
          log('📭', `️Sorry, no valid releases found`)
          logger.receive(`📭 Sorry, no valid releases found`, { context, done: true })
        }
      },
    }

    return sensorr.look(movie, true, hooks).pipe(
      map(releases => releases.sort(sensorr.sort(sensorr.config.sort, sensorr.config.descending))),
      tap(releases => hooks.sorted(releases)),
      filter(releases => releases.length),
      mergeMap(releases => {
        const choices = releases.map(release => [
          (argv.a || argv.auto) ? chalk.green(release.title) : release.title,
          chalk.gray(`(${filesize.stringify(release.size)} - ${release.peers} ↓ / ${release.seeders} ↑)`),
        ].join(' '))

        choices.forEach(choice => log('*', choice))
        return of(releases[0])
      }),
      map(release => ({ movie, release }))
    )
  }

  function grab(movie, release, context = {}) {
    log('🎟️ ', `Grabbing ${chalk.inverse(release.title)} from ${chalk.gray(release.site)}`)
    logger.fetch(`🎟️ Grabbing **${release.title}** from **_${release.site}_**`, { context, success: true, release })

    return of(null).pipe(
      mergeMap(() => of(sensorr.config.blackhole).pipe(
        mergeMap(blackhole => bindNodeCallback(fs.access)(blackhole, fs.constants.W_OK).pipe(
          map(err => !err),
          mergeMap(exist => exist ? of(null) : bindNodeCallback(fs.mkdir)(blackhole, { recursive: true })),
          mergeMap(err => err ? throwError(err) : of(null)),
        )),
      )),
      mergeMap(() => of(release.link).pipe(
        mergeMap(link => fetch(encodeURI(link))),
        mergeMap(res => res.buffer()),
        mergeMap(buffer => {
          const filename = `${sensorr.config.blackhole}/${filenamify(`${release.meta.generated}-${release.site}`)}.torrent`

          return bindNodeCallback(fs.writeFile)(filename, buffer).pipe(
            mergeMap(err => err ? throwError(err) : of(filename)),
          )
        }),
      )),
      mergeMap(file => of(null).pipe(
        mergeMap(() => db.movies.upsert(movie.id, (doc) => ({
          ...doc,
          ...movie,
          time: Date.now(),
          state: 'archived',
        }))),
        mapTo({ movie, release, file }),
      )),
    )
  }
}


  function recordSeries(series) {
    const record = uuidv4()
    const context = { session, record, series: series.id }

    return of(series).pipe(
      mergeMap(series => tmdb.getSeriesDetails(series.id)),
      map(details => new Series({ ...series, ...details }).normalize()),
      mergeMap(series => from(db.series.upsert(series.id, (doc) => ({ ...doc, ...series, time: Date.now() }))).pipe(mapTo(series))),
      mergeMap(series => from((series.seasons || []).reduce((acc, season) => ([...acc, ...(season.episodes || []).map(ep => ({ ...ep, season_number: season.season_number }))]), [] )).pipe(
        mergeMap(ep => hasSeriesInPlex(series).then(exists => ({ ep, exists }))),
        filter(({ exists }) => !exists),
        map(({ ep }) => ep),
        filter(ep => ep.status === 'aired'),
        filter(ep => !(series.watched || {})[`${ep.season_number}:${ep.episode_number}`]),
        mergeMap(ep => lookEpisode(series, ep, context), null, 1),
      )),
      catchError(() => EMPTY),
    )
  }

  async function hasSeriesInPlex(series) {
    if (!plex) return false
    try {
      const sections = (((await plex.client.query('/library/sections')).MediaContainer || {}).Directory || []).filter(s => (s.type || '').toLowerCase() === 'show')
      for (const section of sections) {
        const items = (((await plex.client.query(`/library/sections/${section.key}/all`)).MediaContainer || {}).Metadata || [])
        if (items.some(item => (item.title || '').toLowerCase() === (series.title || '').toLowerCase())) {
          return true
        }
      }
      return false
    } catch (e) {
      return false
    }
  }

  function lookEpisode(series, episode, context = {}) {
    log('📺', `Looking for ${chalk.inverse(series.title)} S${String(episode.season_number).padStart(2,'0')}E${String(episode.episode_number).padStart(2,'0')}`)

    return sensorr.lookEpisode(series, episode, true, {}).pipe(
      map(releases => releases.sort(sensorr.sort(sensorr.config.sort, sensorr.config.descending))),
      filter(releases => releases.length),
      map(releases => releases[0]),
      mergeMap(release => grabEpisode(series, episode, release, context)),
    )
  }

  function grabEpisode(series, episode, release, context = {}) {
    const blackhole = (sensorr.config.tv || {}).blackhole || sensorr.config.blackhole
    return of(release.link).pipe(
      mergeMap(link => fetch(encodeURI(link))),
      mergeMap(res => res.buffer()),
      mergeMap(buffer => {
        const episodeTag = `S${String(episode.season_number).padStart(2,'0')}E${String(episode.episode_number).padStart(2,'0')}`
        const filename = `${blackhole}/${filenamify(`${series.title}-${episodeTag}-${release.site}`)}.torrent`
        return bindNodeCallback(fs.mkdir)(blackhole, { recursive: true }).pipe(
          mergeMap(() => bindNodeCallback(fs.writeFile)(filename, buffer)),
          mapTo(filename),
        )
      }),
      mergeMap(file => of(null).pipe(
        mergeMap(() => db.series.upsert(series.id, (doc) => ({
          ...doc,
          ...series,
          watched: { ...(doc.watched || {}), [`${episode.season_number}:${episode.episode_number}`]: true },
          time: Date.now(),
        }))),
        mapTo({ movie: { title: series.title, year: new Date(episode.air_date || Date.now()).getFullYear() }, release, file, context }),
      )),
    )
  }

module.exports = record
