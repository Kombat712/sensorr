const assert = require('assert')
const { of } = require('rxjs')
const Sensorr = require('../shared/Sensorr')

const sensorr = new Sensorr({ xznabs: [], policy: { avoid: {}, prefer: {} } })

// filterSeries
assert.ok(sensorr.filterSeries({ meta: { resolution: '1080p' } }), 'filterSeries passes with empty avoid policy')

sensorr.config.seriesPolicy = { avoid: { resolution: ['720p'] } }
assert.throws(() => sensorr.filterSeries({ meta: { resolution: '720p' } }), 'filterSeries rejects avoided resolution')
sensorr.config.seriesPolicy = { avoid: {} }

// lookEpisode with mocked look
sensorr.look = () => of([
  { valid: true, warning: 0, score: 10, meta: { generated: 'Show S01E02 1080p' } },
  { valid: true, warning: 0, score: 10, meta: { generated: 'Show S01E02 4K' } },
])

let count = 0
sensorr.lookEpisode({ title: 'Show', terms: { titles: ['show'], years: [2020] } }, { season_number: 1, episode_number: 2, air_date: Date.now() }, false, {})
  .subscribe((releases) => {
    count = releases.length
    assert.equal(count, 2, 'lookEpisode should return 2 releases for S01E02 mock')
  })

// Season pack detection
sensorr.look = () => of([
  { valid: true, warning: 0, score: 10, meta: { generated: 'Show S01 COMPLETE 1080p' } },
])

sensorr.lookEpisode({ title: 'Show', terms: { titles: ['show'], years: [2020] } }, { season_number: 1, episode_number: 1, air_date: Date.now() }, false, {})
  .subscribe((releases) => {
    assert.ok(releases.length > 0, 'Season pack should be matched')
  })

// lookSeries convenience wrapper
const result = sensorr.lookSeries({ title: 'Show', terms: { titles: ['show'], years: [2020] } }, 1, 2)
assert.ok(result, 'lookSeries should return an observable')

console.log('shared.sensorr-series.test.js passed')
