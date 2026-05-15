const TMDB = require('@shared/services/TMDB')
const Documents = require('@shared/Documents')

async function checkNewEpisodes({ log, sensorr, db }) {
  log('🔍 Checking for new episodes...')

  const tmdbKey = sensorr.config.tmdb
  if (!tmdbKey) {
    log('TMDB API key not configured')
    return
  }

  const tmdbClient = new TMDB({ key: tmdbKey, region: sensorr.config.region })
  const seriesList = await db.series.find({ selector: { state: { $eq: 'following' } } })

  if (!seriesList.docs.length) {
    log('No followed series')
    return
  }

  let newCount = 0

  for (const series of seriesList.docs) {
    try {
      const payload = await tmdbClient.getSeriesDetails(series.id)
      const normalized = new Documents.Series(payload).normalize()
      const existingSeasons = series.seasons || []
      let changed = false

      for (const season of normalized.seasons) {
        if (season.season_number === 0) continue
        const existing = existingSeasons.find(s => s.season_number === season.season_number)
        if (!existing || (season.episodes || []).length > (existing.episodes || []).length) {
          changed = true
          newCount++
          log(`New episodes found for ${normalized.title} Season ${season.season_number}`)
        }
      }

      if (changed) {
        await db.series.upsert(series.id, (doc) => ({
          ...doc,
          ...normalized,
          time: Date.now(),
        }))
      }
    } catch (e) {
      log(`Failed to check ${series.id}: ${e.message}`)
    }
  }

  log(`checkNewEpisodes done. Found ${newCount} series with new episodes.`)
}

module.exports = checkNewEpisodes
