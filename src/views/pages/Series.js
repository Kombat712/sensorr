import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import tmdb from 'store/tmdb'
import database from 'store/database'
import { Series as SeriesDocument } from 'shared/Documents'
import theme from 'theme'

const styles = {
  wrapper: { padding: '1.5em' },
  card: { display: 'flex', gap: '1em' },
  poster: { width: '12em', borderRadius: '0.5em' },
  seasons: { marginTop: '1.5em' },
  season: { background: 'white', borderRadius: '0.5em', padding: '1em', marginBottom: '1em' },
  episode: { display: 'flex', justifyContent: 'space-between', margin: '0.25em 0' },
  button: { ...theme.resets.button, padding: '0.5em 0.75em', background: theme.colors.rangoon, color: 'white', borderRadius: '0.35em' },
}

const Series = ({ match: { params: { id } } }) => {
  const [details, setDetails] = useState(null)
  const [state, setState] = useState('following')
  const [watched, setWatched] = useState({})

  useEffect(() => {
    tmdb.getSeriesDetails(id).then(async (payload) => {
      const normalized = new SeriesDocument(payload).normalize()
      setDetails(normalized)
      const db = await database.get()
      const exists = await db.series.findOne().where('id').eq(normalized.id).exec()
      if (exists) {
        setState(exists.state || 'following')
        setWatched(exists.watched || {})
      }
    })
  }, [id])

  const persist = async (partial = {}) => {
    if (!details) return
    const db = await database.get()
    const doc = { ...details, state, watched, time: Date.now(), ...partial }
    const exists = await db.series.findOne().where('id').eq(details.id).exec()
    if (exists) {
      await exists.update({ $set: doc })
    } else {
      await db.series.insert(doc)
    }
  }

  if (!details) return <div css={styles.wrapper}>Loading series...</div>

  return (
    <div css={styles.wrapper}>
      <Helmet><title>Sensorr - Series - {details.title}</title></Helmet>
      <div css={styles.card}>
        {details.poster_path && <img css={styles.poster} src={`https://image.tmdb.org/t/p/w342${details.poster_path}`} />}
        <div>
          <h1>{details.title}</h1>
          <p>{details.overview}</p>
          <p>⭐ {details.vote_average} • Seasons: {details.seasons_count}</p>
          <div>
            {['following', 'skipped', 'watched'].map(next => (
              <button key={next} css={styles.button} style={{ opacity: state === next ? 1 : 0.6, marginRight: '0.5em' }} onClick={() => { setState(next); persist({ state: next }) }}>
                {next}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div css={styles.seasons}>
        {(details.seasons || []).map(season => (
          <div key={season.id} css={styles.season}>
            <h3>Season {season.season_number}</h3>
            {(season.episodes || []).map(episode => {
              const key = `${season.season_number}:${episode.episode_number}`
              const isWatched = !!watched[key]
              return (
                <div key={episode.id} css={styles.episode}>
                  <span>S{season.season_number}E{episode.episode_number} — {episode.name}</span>
                  <label>
                    <input type="checkbox" checked={isWatched} onChange={(e) => {
                      const next = { ...watched, [key]: e.target.checked }
                      setWatched(next)
                      persist({ watched: next })
                    }} /> watched
                  </label>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Series
