import React, { useState } from 'react'
import theme from 'theme'

const styles = {
  wrapper: { marginTop: '1.5em' },
  season: { background: 'white', borderRadius: '0.5em', marginBottom: '1em', overflow: 'hidden' },
  seasonHeader: { display: 'flex', alignItems: 'center', gap: '1em', padding: '1em', cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } },
  seasonPoster: { width: '4em', borderRadius: '0.25em' },
  episode: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5em 1em 0.5em 5em', borderTop: '1px solid #eee' },
  episodeMeta: { fontSize: '0.95em' },
  episodeStatus: { fontSize: '0.8em', color: '#888' },
  checkbox: { marginLeft: '0.5em', cursor: 'pointer' },
}

const Seasons = ({ seasons = [], watched = {}, onWatchedChange }) => {
  const [open, setOpen] = useState({})

  const toggleSeason = (num) => setOpen(prev => ({ ...prev, [num]: !prev[num] }))

  return (
    <div css={styles.wrapper}>
      {seasons.filter(s => s.season_number > 0).map(season => (
        <div key={season.id} css={styles.season}>
          <div css={styles.seasonHeader} onClick={() => toggleSeason(season.season_number)}>
            {season.poster_path && <img css={styles.seasonPoster} src={`https://image.tmdb.org/t/p/w92${season.poster_path}`} />}
            <div>
              <strong>Season {season.season_number}</strong>
              <span style={{ marginLeft: '0.5em', color: '#888' }}>({(season.episodes || []).length} episodes)</span>
            </div>
          </div>
          {open[season.season_number] && (season.episodes || []).map(episode => {
            const key = `${season.season_number}:${episode.episode_number}`
            const isWatched = !!watched[key]
            return (
              <div key={episode.id} css={styles.episode}>
                <div>
                  <div css={styles.episodeMeta}>
                    S{season.season_number}E{episode.episode_number} — {episode.name}
                  </div>
                  <div css={styles.episodeStatus}>
                    {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'} &middot; {episode.status}
                  </div>
                </div>
                <label css={styles.checkbox}>
                  <input type="checkbox" checked={isWatched} onChange={(e) => {
                    onWatchedChange({ ...watched, [key]: e.target.checked })
                  }} /> watched
                </label>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default Seasons
