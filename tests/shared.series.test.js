const assert = require('assert')
const { Series, Season, Episode } = require('../shared/Documents')

// Basic normalization
const doc = new Series({
  id: 100,
  name: 'Dark',
  original_name: 'Dark',
  overview: 'Time travel',
  genres: [{ id: 18 }],
  number_of_seasons: 3,
  vote_average: 8.4,
  seasons: [{ season_number: 1, episodes: [{ episode_number: 1, name: 'Secrets', air_date: '2017-12-01' }] }],
}).normalize()

assert.equal(doc.type, 'series', 'Series type should be "series"')
assert.equal(doc.id, '100', 'Series id should be string')
assert.equal(doc.title, 'Dark', 'Series title should match')
assert.equal(doc.status, 'ongoing', 'Series with no status should default to ongoing')
assert.equal(doc.seasons_count, 3, 'Seasons count should match')

// State defaults
const defaultState = new Series({ id: 200, name: 'Test' }).normalize()
assert.equal(defaultState.state, 'following', 'Default state should be following')

// Status normalization
const ended = new Series({ id: 201, name: 'Ended show', status: 'Ended' }).normalize()
assert.equal(ended.status, 'ended', 'Status "Ended" should normalize to "ended"')

const cancelled = new Series({ id: 202, name: 'Cancelled', status: 'Cancelled' }).normalize()
assert.equal(cancelled.status, 'ended', 'Status "Cancelled" should normalize to "ended"')

const returning = new Series({ id: 203, name: 'Returning', status: 'Returning Series' }).normalize()
assert.equal(returning.status, 'ongoing', 'Status "Returning Series" should normalize to "ongoing"')

// Season normalization
const season = new Season({ series_id: 100, season_number: 2, overview: 'Second season', poster_path: '/p.jpg', air_date: '2019-06-21' }).normalize()
assert.equal(season.id, '100:s2', 'Season id should follow series:sN format')
assert.equal(season.series_id, '100', 'Season series_id should match')
assert.equal(season.season_number, 2, 'Season number should match')
assert.equal(season.type, 'season', 'Season type should be "season"')

// Episode normalization
const episode = new Episode({ series_id: 100, season_number: 2, episode_number: 3, name: 'Test Episode', overview: 'Desc', air_date: '2019-06-21' }).normalize()
assert.equal(episode.id, '100:s2:e3', 'Episode id should follow series:sN:eN format')
assert.equal(episode.series_id, '100', 'Episode series_id should match')
assert.equal(episode.season_number, 2, 'Episode season_number should match')
assert.equal(episode.episode_number, 3, 'Episode episode_number should match')
assert.equal(episode.name, 'Test Episode', 'Episode name should match')
assert.equal(episode.type, 'episode', 'Episode type should be "episode"')

// Future episode
const futureEp = new Episode({ series_id: 100, season_number: 1, episode_number: 10, name: 'Future', air_date: '2999-01-01' }).normalize()
assert.equal(futureEp.status, 'unreleased', 'Future episode should be "unreleased"')

// Past episode
const pastEp = new Episode({ series_id: 100, season_number: 1, episode_number: 10, name: 'Past', air_date: '2020-01-01' }).normalize()
assert.equal(pastEp.status, 'aired', 'Past episode should be "aired"')

// Watched flag
const watchedEp = new Episode({ series_id: 100, season_number: 1, episode_number: 5, watched: true }).normalize()
assert.equal(watchedEp.watched, true, 'Watched flag should be preserved')

const unwatchedEp = new Episode({ series_id: 100, season_number: 1, episode_number: 6, watched: false }).normalize()
assert.equal(unwatchedEp.watched, false, 'Unwatched flag should be preserved')

// Sortings
assert.ok(Series.Sortings.time, 'Series should have time sorting')
assert.ok(Series.Sortings.popularity, 'Series should have popularity sorting')
assert.ok(Series.Sortings.vote_average, 'Series should have vote_average sorting')

// Filters
const stateFilter = Series.Filters.state()
assert.ok(stateFilter, 'Series should have state filter')
assert.ok(stateFilter.options.find(o => o.value === 'following'), 'State filter should include "following"')
assert.ok(stateFilter.options.find(o => o.value === 'skipped'), 'State filter should include "skipped"')
assert.ok(stateFilter.options.find(o => o.value === 'watched'), 'State filter should include "watched"')

// Empty payload handling
const emptyPayload = new Series({}).normalize()
assert.equal(emptyPayload.title, '', 'Empty series title should be empty string')
assert.equal(emptyPayload.seasons_count, 0, 'Empty series seasons_count should be 0')
assert.equal(emptyPayload.state, 'following', 'Empty series state should default to following')

const emptySeason = new Season({}).normalize()
assert.equal(emptySeason.season_number, 0, 'Empty season season_number should be 0')
assert.equal(emptySeason.series_id, '', 'Empty season series_id should be empty string')

const emptyEpisode = new Episode({}).normalize()
assert.equal(emptyEpisode.episode_number, 0, 'Empty episode episode_number should be 0')
assert.equal(emptyEpisode.status, 'unreleased', 'Empty episode should be unreleased')
assert.equal(emptyEpisode.watched, false, 'Empty episode watched should be false')

console.log('shared.series.test.js passed')
