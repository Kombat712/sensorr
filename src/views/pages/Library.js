import React, { Fragment } from 'react'
import { compose } from 'redux'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import withDatabaseQuery from 'components/Layout/Items/withDatabaseQuery'
import withControls from 'components/Layout/Items/withControls'
import Movie from 'components/Entity/Movie'
import * as Documents from 'shared/Documents'
import { setHistoryState } from 'utils/history'
import theme from 'theme'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
}

const buildLibraryItems = (query, label, filters = Documents.Movie.Filters, sortings = Documents.Movie.Sortings) => compose(
  withDatabaseQuery(query, true),
  withControls({
    label: ({ total, reset }) => (
      <button css={theme.resets.button} onClick={() => reset()}>
        <span><strong>{total}</strong> {label}</span>
      </button>
    ),
    filters,
    sortings,
    initial: () => ({
      filtering: window?.history?.state?.state?.controls?.filtering || {},
      sorting: window?.history?.state?.state?.controls?.sorting || 'time',
      reverse: window?.history?.state?.state?.controls?.reverse || false,
    }),
    defaults: {
      filtering: {},
      sorting: 'time',
      reverse: false,
    },
    render: {
      pane: (blocks) => (
        <>
          {blocks.genre && Emotion.jsx(blocks.genre.element, blocks.genre.props)}
          {blocks.state && Emotion.jsx(blocks.state.element, blocks.state.props)}
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {blocks.year && Emotion.jsx(blocks.year.element, { ...blocks.year.props, display: 'column' })}
            {blocks.popularity && Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
            {blocks.vote_average && Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
            {blocks.runtime && Emotion.jsx(blocks.runtime.element, { ...blocks.runtime.props, display: 'column' })}
          </div>
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
    history: history,
  }),
)(Items)

const LibraryMovieItems = buildLibraryItems((db) => db.movies.find().where('state').ne('ignored'), 'Movies')
const LibrarySeriesItems = buildLibraryItems((db) => db.series.find().where('state').ne('ignored'), 'Series', Documents.Series.Filters, Documents.Series.Sortings)

const Library = ({ history }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Library</title>
    </Helmet>
    <div css={styles.wrapper}>
      <LibraryMovieItems
        display="virtual-grid"
        child={Movie}
        placeholders={history.location.state?.items?.total || null}
        onFetched={({ total }) => setHistoryState({ items: { total } })}
      />
      <LibrarySeriesItems
        display="virtual-grid"
        child={Movie}
        props={{ link: (entity) => `/series/${entity.id}` }}
        empty={{
          emoji: '📺',
          title: 'No series in your library yet',
          subtitle: <span>Add a TV series and it will appear here.</span>,
        }}
      />
    </div>
  </Fragment>
)

export default Library
