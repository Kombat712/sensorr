import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import database from 'store/database'
import theme from 'theme'

const styles = {
  wrapper: { padding: '1.5em', backgroundColor: theme.colors.smoke, minHeight: '100%' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' },
  navBtn: { padding: '0.5em 1em', background: 'white', border: '1px solid #ccc', borderRadius: '0.35em', cursor: 'pointer', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5em' },
  dayHeader: { textAlign: 'center', fontWeight: 600, padding: '0.5em', color: '#888', fontSize: '0.85em' },
  day: { background: 'white', borderRadius: '0.35em', padding: '0.5em', minHeight: '6em' },
  dayNum: { fontWeight: 600, marginBottom: '0.35em', fontSize: '0.9em' },
  epLink: { display: 'block', fontSize: '0.75em', padding: '0.2em 0', color: theme.colors.rangoon, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SeriesCalendar = ({ match: { params } }) => {
  const date = new Date()
  const yearParam = parseInt(params.year) || date.getFullYear()
  const monthParam = parseInt(params.month) || (date.getMonth() + 1)

  const [year, setYear] = useState(yearParam)
  const [month, setMonth] = useState(monthParam)
  const [episodes, setEpisodes] = useState({})

  useEffect(() => {
    setYear(yearParam)
    setMonth(monthParam)
  }, [yearParam, monthParam])

  useEffect(() => {
    (async () => {
      const db = await database.get()
      const seriesList = await db.series.find().exec()
      const allEps = {}
      for (const s of seriesList) {
        for (const season of (s.seasons || [])) {
          for (const ep of (season.episodes || [])) {
            const d = new Date(ep.air_date)
            if (d.getFullYear() === year && d.getMonth() + 1 === month) {
              const key = d.getDate()
              if (!allEps[key]) allEps[key] = []
              allEps[key].push({ ...ep, seriesTitle: s.title, seriesId: s.id })
            }
          }
        }
      }
      setEpisodes(allEps)
    })()
  }, [year, month])

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} css={styles.day} />)
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEps = episodes[d] || []
    cells.push(
      <div key={d} css={styles.day}>
        <div css={styles.dayNum}>{d}</div>
        {dayEps.slice(0, 5).map((ep, i) => (
          <Link key={i} css={styles.epLink} to={`/series/${ep.seriesId}`}>
            {ep.seriesTitle} S{ep.season_number}E{ep.episode_number}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div css={styles.wrapper}>
      <Helmet><title>Sensorr - Series Calendar</title></Helmet>
      <div css={styles.nav}>
        <button css={styles.navBtn} onClick={prevMonth}>← Previous</button>
        <h2>{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button css={styles.navBtn} onClick={nextMonth}>Next →</button>
      </div>
      <div css={styles.grid}>
        {DAYS.map(d => <div key={d} css={styles.dayHeader}>{d}</div>)}
        {cells}
      </div>
    </div>
  )
}

export default SeriesCalendar
