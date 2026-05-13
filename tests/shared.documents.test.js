const assert = require('assert')
const { Series } = require('../shared/Documents')

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

assert.equal(doc.type, 'series')
assert.equal(doc.seasons.length, 1)
assert.equal(doc.seasons[0].episodes[0].status, 'aired')
assert.equal(doc.seasons[0].episodes[0].id, '100:s1:e1')

console.log('shared.documents.test.js passed')
