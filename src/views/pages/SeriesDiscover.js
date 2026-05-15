import React, { Fragment } from 'react'
import { compose } from 'redux'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import withTMDBQuery from 'components/Layout/Items/withTMDBQuery'
import withControls from 'components/Layout/Items/withControls'
import Movie from 'components/Entity/Movie'
import { TV_GENRES } from 'shared/services/TMDB'
import { setHistoryState } from 'utils/history'
import theme from 'theme'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
}

const Filters = {
  with_genres: () => {
    const options = Object.keys(TV_GENRES).map(genre => ({
      value: genre,
      label: TV_GENRES[genre],
    }))

    return {
      label: 'Genres',
      type: 'select',
      options,
      default: [],
      behavior: 'OR',
      apply: () => true,
      serialize: (options, behavior) => ({
        with_genres: (options || []).map(option => option.value).join({ AND: ',', OR: '|' }[behavior] || '|'),
      }),
      props: {
        name: 'with_genres',
        isMulti: true,
        isSearchable: true,
        isClearable: false,
        closeMenuOnSelect: false,
        placeholder: `${options.map(option => option.label).slice(0, 3).join(', ')}...`,
      },
    }
  },
  vote_average: () => {
    const min = 0
    const max = 10
    return {
      label: 'Vote Average',
      type: 'range',
      default: [min, max],
      min, max,
      apply: () => true,
      serialize: (values) => ({
        ...(values[0] !== min ? { 'vote_average.gte': values[0] } : {}),
        ...(values[1] !== max ? { 'vote_average.lte': values[1] } : {}),
      }),
    }
  },
}

const Sortings = {
  popularity: {
    value: 'popularity',
    label: '📣  Popularity',
    labelize: (entity) => entity.popularity,
    apply: () => 0,
  },
  vote_average: {
    value: 'vote_average',
    label: '⭐  Vote Average',
    labelize: (entity) => entity.vote_average || 0,
    apply: () => 0,
  },
}

const SeriesDiscoverItems = compose(
  withTMDBQuery({
    uri: ['discover', 'tv'],
    params: {},
  }, null, true),
  withControls({
    hideQuery: true,
    label: ({ total, reset }) => (
      <button css={theme.resets.button} onClick={() => reset()}>
        <span><strong>{total === 10000 ? '∞' : total}</strong> Discovered Series</span>
      </button>
    ),
    filters: Filters,
    sortings: Sortings,
    initial: () => ({
      filtering: window?.history?.state?.state?.controls?.filtering || {},
      behaviors: window?.history?.state?.state?.controls?.behaviors || {},
      sorting: window?.history?.state?.state?.controls?.sorting || 'popularity',
      reverse: window?.history?.state?.state?.controls?.reverse || false,
    }),
    defaults: {
      filtering: {},
      behaviors: {},
      sorting: 'popularity',
      reverse: false,
    },
    render: {
      pane: (blocks) => (
        <>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.with_genres.element, blocks.with_genres.props)}
          </div>
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
          </div>
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
  }),
)(Items)

const SeriesDiscover = ({ history }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Discover Series</title>
    </Helmet>
    <div css={styles.wrapper}>
      <SeriesDiscoverItems
        display="virtual-grid"
        child={Movie}
        props={{ link: (entity) => `/series/${entity.id}` }}
        empty={{
          emoji: '📺',
          title: "Oh no, your request didn't return results",
          subtitle: <span>Try different filters or genres.</span>,
        }}
      />
    </div>
  </Fragment>
)

export default SeriesDiscover
