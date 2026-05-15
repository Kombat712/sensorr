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

const SeriesLibraryItems = compose(
  withDatabaseQuery((db) => db.series.find().where('state').ne('ignored'), true),
  withControls({
    label: ({ total, reset }) => (
      <button css={theme.resets.button} onClick={() => reset()}>
        <span><strong>{total}</strong> Series</span>
      </button>
    ),
    filters: Documents.Series.Filters,
    sortings: Documents.Series.Sortings,
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
            {blocks.popularity && Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
            {blocks.vote_average && Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
          </div>
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
    history: window.history,
  }),
)(Items)

const SeriesLibrary = ({ history }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Series Library</title>
    </Helmet>
    <div css={styles.wrapper}>
      <SeriesLibraryItems
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

export default SeriesLibrary
