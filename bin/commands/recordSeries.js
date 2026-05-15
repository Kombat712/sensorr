const { from, of, EMPTY } = require('rxjs')
const { map, tap, filter, mergeMap, toArray, catchError } = require('rxjs/operators')
const { request } = require('universal-rxjs-ajax')
const XZNAB = require('@shared/services/XZNAB')
const path = require('path')
const fs = require('fs')

async function recordSeries({ log, sensorr, db }) {
  log('📺 Checking series for new episodes to download...')

  const blackhole = sensorr.config.seriesBlackhole || '/tmp/series'

  const seriesList = await db.series.find({ selector: { state: { $eq: 'following' } } })

  if (!seriesList.docs.length) {
    log('No followed series found')
    return
  }

  for (const series of seriesList.docs) {
    const seasons = series.seasons || []
    for (const season of seasons) {
      const episodes = season.episodes || []
      for (const episode of episodes) {
        if (episode.status === 'aired' && !episode.watched) {
          log(`Found unwatched aired episode: ${series.title} S${season.season_number}E${episode.episode_number}`)

          try {
            const ep = { season_number: season.season_number, episode_number: episode.episode_number, air_date: Date.now() }

            await new Promise((resolve, reject) => {
              sensorr.lookEpisode(series, ep, false, {}).pipe(
                mergeMap(releases => from(releases.filter(r => r.valid))),
                toArray(),
                map(releases => releases.sort((a, b) => b.score - a.score).shift()),
                filter(release => release),
                mergeMap(release => {
                  const xznab = sensorr.xznabs[0]
                  if (!xznab) return EMPTY
                  const link = `${xznab.url}?apikey=${xznab.key}&t=get&id=${release.guid}`
                  return request({ url: link, responseType: 'arraybuffer' }).pipe(
                    map(response => ({ release, response }))
                  )
                }),
                catchError(() => EMPTY),
              ).subscribe(
                ({ release, response }) => {
                  const filename = path.join(blackhole, `${series.title.replace(/[^a-z0-9]/gi, '_')}_S${season.season_number}E${episode.episode_number}.nzb`)
                  fs.writeFileSync(filename, Buffer.from(response.response))
                  log(`Downloaded ${release.title} to ${filename}`)
                },
                () => reject(),
                () => resolve(),
              )
            })
          } catch (e) {
            log(`Failed to download episode: ${e.message}`)
          }
        }
      }
    }
  }

  log('recordSeries done')
}

module.exports = recordSeries
