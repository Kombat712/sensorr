import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import tmdb from 'store/tmdb'
import database from 'store/database'
import { Series as SeriesDocument } from 'shared/Documents'
import theme from 'theme'
import Seasons from './blocks/Seasons'
import Releases from './blocks/Releases'

const styles = {
  wrapper: { padding: '1.5em' },
  card: { display: 'flex', gap: '1em' },
  poster: { width: '12em', borderRadius: '0.5em', flexShrink: 0 },
  info: { flex: 1 },
  genres: { display: 'flex', flexWrap: 'wrap', gap: '0.5em', margin: '0.5em 0' },
  genre: { background: theme.colors.rangoon, color: 'white', padding: '0.25em 0.5em', borderRadius: '1em', fontSize: '0.8em' },
  tabBar: { display: 'flex', gap: '1em', marginTop: '1.5em', borderBottom: '2px solid #ddd' },
  tab: { ...theme.resets.button, padding: '0.5em 1em', cursor: 'pointer', fontWeight: 600, borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { borderBottomColor: theme.colors.rangoon, color: theme.colors.rangoon },
  stateBar: { display: 'flex', gap: '0.5em', marginTop: '1em' },
  stateBtn: { ...theme.resets.button, padding: '0.5em 0.75em', borderRadius: '0.35em', fontWeight: 600, cursor: 'pointer', border: '1px solid #ccc' },
}

const TV_GENRES = {
  10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
  10768: 'War & Politics', 10763: 'News', 10764: 'Reality', 10762: 'Kids',
  16: 'Animation', 35: 'Comedy', 18: 'Drama', 9648: 'Mystery', 80: 'Crime',
  99: 'Documentary', 36: 'History', 10751: 'Family', 37: 'Western',
  27: 'Horror', 53: 'Thriller', 10752: 'War', 28: 'Action',
  12: 'Adventure', 14: 'Fantasy', 878: 'Science Fiction',
}

const Series = ({ match: { params: { id } } }) => {
  const [details, setDetails] = useState(null)
  const [seriesState, setSeriesState] = useState('following')
  const [watched, setWatched] = useState({})
  const [tab, setTab] = useState('seasons')

  useEffect(() => {
    tmdb.getSeriesDetails(id).then(async (payload) => {
      const normalized = new SeriesDocument(payload).normalize()
      setDetails(normalized)
      const db = await database.get()
      const exists = await db.series.findOne().where('id').eq(normalized.id).exec()
      if (exists) {
        setSeriesState(exists.state || 'following')
        setWatched(exists.watched || {})
      }
    })
  }, [id])

  const persist = async (partial = {}) => {
    if (!details) return
    const db = await database.get()
    const doc = { ...details, state: seriesState, watched, time: Date.now(), ...partial }
    const exists = await db.series.findOne().where('id').eq(details.id).exec()
    if (exists) {
      await exists.atomicSet(partial)
    } else {
      await db.series.insert(doc)
    }
  }

  if (!details) return <div css={styles.wrapper}>Loading series...</div>

  return (
    <div css={styles.wrapper}>
      <Helmet><title>Sensorr - Series - {details.title}</title></Helmet>
      <div css={styles.card}>
        {details.poster_path && <img css={styles.poster} src={`https://image.tmdb.org/t/p/w342${details.poster_path}`} alt={details.title} />}
        <div css={styles.info}>
          <h1>{details.title}</h1>
          <p style={{ color: '#666' }}>{details.original_title}</p>
          <p>⭐ {details.vote_average} &middot; Seasons: {details.seasons_count} &middot; Status: {details.status === 'ended' ? 'Ended' : 'Ongoing'}</p>
          <div css={styles.genres}>
            {(details.genres || []).map(g => <span key={g} css={styles.genre}>{TV_GENRES[g] || g}</span>)}
          </div>
          <p>{details.overview}</p>
          <div css={styles.stateBar}>
            {['following', 'skipped', 'watched'].map(next => (
              <button key={next} css={styles.stateBtn} style={{ opacity: seriesState === next ? 1 : 0.5 }} onClick={() => { setSeriesState(next); persist({ state: next }) }}>
                {next === 'following' ? '👀 Following' : next === 'skipped' ? '⏭️ Skipped' : '✅ Watched'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div css={styles.tabBar}>
        <button css={[styles.tab, tab === 'seasons' && styles.tabActive]} onClick={() => setTab('seasons')}>Seasons & Episodes</button>
        <button css={[styles.tab, tab === 'releases' && styles.tabActive]} onClick={() => setTab('releases')}>Releases</button>
      </div>
      {tab === 'seasons' && <Seasons seasons={details.seasons} watched={watched} onWatchedChange={(next) => { setWatched(next); persist({ watched: next }) }} />}
      {tab === 'releases' && <Releases series={details} />}
    </div>
  )
}

export default Series
