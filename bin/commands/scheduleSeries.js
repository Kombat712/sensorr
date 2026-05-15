const { from, of } = require('rxjs')
const { map, mergeMap, tap, toArray, delay } = require('rxjs/operators')

async function scheduleSeries({ log, sensorr, db }) {
  log('📅 Updating series schedules from TMDB...')

  const seriesList = await db.series.find({ selector: { state: { $eq: 'following' } } })

  if (!seriesList.docs.length) {
    log('No followed series found')
    return
  }

  const tmdb = sensorr.config.tmdb
  if (!tmdb) {
    log('TMDB API key not configured')
    return
  }

  const TMDB = require('@shared/services/TMDB')
  const tmdbClient = new TMDB({ key: tmdb, region: sensorr.config.region })
  const Documents = require('@shared/Documents')

  let updated = 0

  for (const series of seriesList.docs) {
    try {
      const payload = await tmdbClient.getSeriesDetails(series.id)
      const normalized = new Documents.Series(payload).normalize()

      await db.series.upsert(series.id, (doc) => ({
        ...doc,
        ...normalized,
        time: Date.now(),
      }))

      updated++
      log(`Updated ${normalized.title}`)
    } catch (e) {
      log(`Failed to update series ${series.id}: ${e.message}`)
    }
  }

  log(`scheduleSeries done. Updated ${updated} series.`)
}

module.exports = scheduleSeries
