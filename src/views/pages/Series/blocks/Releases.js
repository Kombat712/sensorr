import React, { useState } from 'react'
import sensorr from 'store/sensorr'

const styles = {
  wrapper: { marginTop: '1.5em' },
  selectRow: { display: 'flex', gap: '1em', alignItems: 'flex-end', marginBottom: '1em' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.25em' },
  label: { fontSize: '0.8em', fontWeight: 600, color: '#555' },
  select: { padding: '0.5em', borderRadius: '0.35em', border: '1px solid #ccc' },
  btn: { padding: '0.5em 1em', borderRadius: '0.35em', background: '#333', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 },
  release: { display: 'flex', justifyContent: 'space-between', padding: '0.75em', background: 'white', borderRadius: '0.35em', marginBottom: '0.5em' },
  releaseTitle: { fontWeight: 600 },
  releaseMeta: { fontSize: '0.85em', color: '#888' },
  grabBtn: { padding: '0.35em 0.75em', borderRadius: '0.35em', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85em' },
}

const Releases = ({ series }) => {
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(false)

  const searchReleases = async () => {
    setLoading(true)
    setReleases([])
    try {
      const ep = { season_number: season, episode_number: episode, air_date: Date.now() }
      sensorr.lookEpisode(series, ep, false, {}).subscribe(setReleases)
    } catch (e) {
      console.error('Search error', e)
    }
    setLoading(false)
  }

  const grabRelease = async (guid) => {
    try {
      const res = await fetch('/api/grabSeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guid }),
      })
      if (res.ok) alert('Release sent to downloader')
    } catch (e) {
      console.error('Grab error', e)
    }
  }

  return (
    <div css={styles.wrapper}>
      <div css={styles.selectRow}>
        <div css={styles.field}>
          <span css={styles.label}>Season</span>
          <select css={styles.select} value={season} onChange={e => setSeason(parseInt(e.target.value))}>
            {Array.from(new Set((series.seasons || []).map(s => s.season_number).filter(n => n > 0))).sort().map(n => (
              <option key={n} value={n}>Season {n}</option>
            ))}
          </select>
        </div>
        <div css={styles.field}>
          <span css={styles.label}>Episode</span>
          <select css={styles.select} value={episode} onChange={e => setEpisode(parseInt(e.target.value))}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>E{n}</option>
            ))}
          </select>
        </div>
        <button css={styles.btn} onClick={searchReleases} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </div>
      {releases.map((r, i) => (
        <div key={r.guid || i} css={styles.release}>
          <div>
            <div css={styles.releaseTitle}>{r.title}</div>
            <div css={styles.releaseMeta}>{r.size && `${(r.size / 1024 / 1024).toFixed(0)} MB`} &middot; {r.seeders ? `${r.seeders} seeders` : 'No seeders'} &middot; Score: {r.score}</div>
          </div>
          <button css={styles.grabBtn} onClick={() => grabRelease(r.guid)}>Grab</button>
        </div>
      ))}
      {!loading && releases.length === 0 && <p style={{ color: '#888' }}>No releases found. Try a different episode.</p>}
    </div>
  )
}

export default Releases
