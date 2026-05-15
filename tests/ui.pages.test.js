const assert = require('assert')
const fs = require('fs')
const path = require('path')

const base = path.resolve(__dirname, '..')

function exists(p) {
  return fs.existsSync(path.join(base, p))
}

// Page files
assert.ok(exists('src/views/pages/Series/index.js'), 'Series detail page should exist')
assert.ok(exists('src/views/pages/Series/blocks/Seasons.js'), 'Seasons component should exist')
assert.ok(exists('src/views/pages/Series/blocks/Releases.js'), 'Releases component should exist')
assert.ok(exists('src/views/pages/SeriesLibrary.js'), 'Series Library page should exist')
assert.ok(exists('src/views/pages/SeriesDiscover.js'), 'Series Discover page should exist')
assert.ok(exists('src/views/pages/SeriesCalendar.js'), 'Series Calendar page should exist')

// Entity component
assert.ok(exists('src/components/Entity/Series.js'), 'Series entity component should exist')

// API endpoint
assert.ok(exists('server/api/grabSeries.js'), 'grabSeries API endpoint should exist')

// CLI commands
assert.ok(exists('bin/commands/recordSeries.js'), 'recordSeries command should exist')
assert.ok(exists('bin/commands/scheduleSeries.js'), 'scheduleSeries command should exist')
assert.ok(exists('bin/commands/checkNewEpisodes.js'), 'checkNewEpisodes command should exist')

console.log('ui.pages.test.js passed')
