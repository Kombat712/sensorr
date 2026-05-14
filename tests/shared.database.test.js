const assert = require('assert')
const Database = require('../shared/Database')

assert.ok(Database.SCHEMAS.series, 'series schema should exist')
assert.equal(Database.SCHEMAS.series.properties.state.default, 'following')
assert.equal(Database.SCHEMAS.series.required.includes('title'), true)

console.log('shared.database.test.js passed')
