const assert = require('assert')
const fs = require('fs')
const path = require('path')

const base = path.resolve(__dirname, '..')

function read(p) {
  return fs.readFileSync(path.join(base, p), 'utf-8')
}

const body = read('src/views/layout/Body.js')
const navbar = read('src/views/layout/Header/blocks/Navbar.js')
const apiIndex = read('server/api/index.js')
const cliIndex = read('bin/commands/index.js')
const ecosystem = read('ecosystem.config.js')

// Body routes
assert.ok(body.includes('SeriesLibrary'), 'Body should import SeriesLibrary')
assert.ok(body.includes('SeriesDiscover'), 'Body should import SeriesDiscover')
assert.ok(body.includes('SeriesCalendar'), 'Body should import SeriesCalendar')
assert.ok(body.includes('/series/library'), 'Body should have /series/library route')
assert.ok(body.includes('/series/discover'), 'Body should have /series/discover route')
assert.ok(body.includes('/series/calendar'), 'Body should have /series/calendar route')
assert.ok(body.includes('views/pages/Series'), 'Body should import Series detail page')

// Navbar links
assert.ok(navbar.includes('Series'), 'Navbar should have Series section')
assert.ok(navbar.includes('/series/library'), 'Navbar should link to Series Library')
assert.ok(navbar.includes('/series/discover'), 'Navbar should link to Series Discover')
assert.ok(navbar.includes('/series/calendar'), 'Navbar should link to Series Calendar')

// API
assert.ok(apiIndex.includes('grabSeries'), 'API should register /grabSeries endpoint')

// CLI
assert.ok(cliIndex.includes('recordSeries'), 'CLI should register recordSeries')
assert.ok(cliIndex.includes('scheduleSeries'), 'CLI should register scheduleSeries')
assert.ok(cliIndex.includes('checkNewEpisodes'), 'CLI should register checkNewEpisodes')

// Ecosystem
assert.ok(ecosystem.includes('recordSeries'), 'Ecosystem should have recordSeries app')
assert.ok(ecosystem.includes('scheduleSeries'), 'Ecosystem should have scheduleSeries app')
assert.ok(ecosystem.includes('checkNewEpisodes'), 'Ecosystem should have checkNewEpisodes app')

console.log('ui.routes.test.js passed')
