const assert = require('assert')
const { of } = require('rxjs')
const Sensorr = require('../shared/Sensorr')

const sensorr = new Sensorr({ xznabs: [] })

sensorr.look = () => of([
  { valid: true, warning: 0, score: 10, meta: { generated: 'Show.S01E02.1080p' } },
  { valid: true, warning: 0, score: 10, meta: { generated: 'Show.S01.PACK.1080p' } },
  { valid: true, warning: 0, score: 10, meta: { generated: 'Show.S01E03.1080p' } },
])

sensorr.lookEpisode({ title: 'Show' }, { season_number: 1, episode_number: 2, air_date: Date.now() }, true, {})
  .subscribe((releases) => {
    assert.equal(releases.length, 2)
    assert.ok(releases.some(r => (r.meta.generated || '').includes('S01E02')))
    assert.ok(releases.some(r => (r.meta.generated || '').includes('S01.PACK')))
    console.log('integration.tv-flow.test.js passed')
  }, (e) => {
    throw e
  })
