import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Series as SeriesDocument } from 'shared/Documents'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '0.5em',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'box-shadow ease 300ms',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
}

const PosterStyles = {
  element: {
    position: 'relative',
    display: 'block',
    height: '15em',
    width: '10em',
    zIndex: 0,
  },
  container: {
    position: 'relative',
    display: 'block',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  empty: {
    backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAwIDI0MDAiPiAgPHBhdGggZmlsbD0iI2NjYyIgZD0iTTg4IDIyMTljLTI0LjcgMC00NS41LTguNS02Mi41LTI1LjVTMCAyMTU2IDAgMjEzMlYzMDdjMC0yNC43IDguNS00NS41IDI1LjUtNjIuNVM2My4zIDIxOSA4OCAyMTloMjIyNGMyNC43IDAgNDUuNSA4LjUgNjIuNSAyNS41czI1LjUgMzcuOCAyNS41IDYyLjV2MTgyNWMwIDI0LTguNSA0NC41LTI1LjUgNjEuNXMtMzcuOCAyNS41LTYyLjUgMjUuNUg4OHptMTEyLTMwMGw2MDYtNDAwYzI0LjcgMTAgNTYuNyAyMy4yIDk2IDM5LjVzMTA0LjUgNDYuMiAxOTUuNSA4OS41IDE2NC4yIDgyLjMgMjE5LjUgMTE3YzIyLjcgMTQuNyAzOS43IDIyIDUxIDIyIDEwIDAgMTUtNiAxNS0xOCAwLTIyLjctMTUtNTguMy00NS0xMDdzLTY4LTk3LjMtMTE0LTE0Ni04Ny43LTgxLTEyNS05N2MyOS4zLTI5LjMgNzQuMy03Ny4zIDEzNS0xNDRzMTEzLjctMTI2IDE1OS0xNzhsNjktNzggNS41LTUuNSAxNS41LTE0IDI0LTIwIDMwLTIxIDM2LTIwIDM5LTE0IDQxLTUuNWMxOCAwIDM3IDMuNSA1NyAxMC41czM3LjggMTUuMyA1My41IDI1IDMwIDE5LjMgNDMgMjkgMjMuMiAxOC4yIDMwLjUgMjUuNWwxMCAxMCAzNTMgMzU4VjQxOUgyMDB2MTUwMHptNDAwLTg4MWMtNjAgMC0xMTEuNS0yMS41LTE1NC41LTY0LjVTMzgxIDg3OSAzODEgODE5czIxLjUtMTExLjUgNjQuNS0xNTQuNVM1NDAgNjAwIDYwMCA2MDBjMzkuMyAwIDc1LjggOS44IDEwOS41IDI5LjVzNjAuMyA0Ni4zIDgwIDgwUzgxOSA3NzkuNyA4MTkgODE5YzAgNjAtMjEuNSAxMTEuNS02NC41IDE1NC41UzY2MCAxMDM4IDYwMCAxMDM4eiIvPjwvc3ZnPg==)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '50%',
  },
  link: {
    display: 'block',
    height: '100%',
    width: '100%',
    cursor: 'pointer',
  },
}

const Series = ({ entity, link }) => (
  <Link to={link ? link(entity) : `/series/${entity.id}`} css={styles.element}>
    {entity.poster_path ? (
      <img src={`https://image.tmdb.org/t/p/w300${entity.poster_path}`} alt={entity.title} style={{ width: '100%', display: 'block' }} />
    ) : (
      <div style={{ height: '15em', background: '#eee' }} />
    )}
    <div style={{ padding: '0.75em' }}>
      <div style={{ fontWeight: 600, fontSize: '1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {entity.title}
      </div>
      <div style={{ fontSize: '0.8em', color: '#888' }}>
        ⭐ {entity.vote_average} &middot; {entity.seasons_count} seasons
      </div>
      <div style={{ fontSize: '0.75em', color: '#888', marginTop: '0.35em' }}>
        State: {entity.state}
      </div>
    </div>
  </Link>
)

export const Poster = ({ entity, link, ...props }) => {
  return (
    <span css={PosterStyles.element} {...props}>
      <span css={PosterStyles.container}>
        <Link to={link && entity.id ? link(entity) : ''} css={PosterStyles.link}>
          {entity.poster_path ? (
            <img css={PosterStyles.img} src={`https://image.tmdb.org/t/p/w300${entity.poster_path}`} alt={entity.title} />
          ) : (
            <span css={PosterStyles.empty} style={{ display: 'block', height: '100%' }} />
          )}
        </Link>
      </span>
    </span>
  )
}

export const Focus = ({ entity, ...props }) => {
  return (
    <div {...props}>
      <div css={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5em', textAlign: 'center' }}>
        <strong>{entity.vote_average || '?'}</strong>
      </div>
    </div>
  )
}

export const State = ({ entity, db }) => (
  <div style={{ display: 'flex', gap: '0.5em', padding: '0.5em' }}>
    {['following', 'skipped', 'watched'].map(next => (
      <button
        key={next}
        style={{
          padding: '0.35em 0.5em',
          borderRadius: '0.25em',
          border: '1px solid #ccc',
          background: entity.state === next ? '#333' : 'white',
          color: entity.state === next ? 'white' : '#333',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.8em',
        }}
        onClick={() => db.series.upsert(entity.id, (doc) => ({ ...doc, ...entity, state: next, time: Date.now() }))}
      >
        {next === 'following' ? '👀' : next === 'skipped' ? '⏭️' : '✅'}
      </button>
    ))}
  </div>
)

export { Series }
export default Series
