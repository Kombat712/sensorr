const assert = require('assert')
const TMDB = require('../shared/services/TMDB')

const client = new TMDB({ key: 'k', region: 'en-US', adult: false })

assert.ok(client.build(['search', 'tv'], { query: 'dark' }).includes('search/tv'))
assert.ok(client.build(['trending', 'tv', 'week']).includes('trending/tv/week'))
assert.ok(client.build(['discover', 'tv'], { with_genres: 18 }).includes('with_genres=18'))

console.log('shared.tmdb.test.js passed')
