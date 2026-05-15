const record = require('@bin/commands/record')
const schedule = require('@bin/commands/schedule')
const pairwise = require('@bin/commands/pairwise')
const purge = require('@bin/commands/purge')
const hydrate = require('@bin/commands/hydrate')
const checkEpisodes = require('@bin/commands/check-episodes')
const recordSeries = require('@bin/commands/recordSeries')
const scheduleSeries = require('@bin/commands/scheduleSeries')
const checkNewEpisodes = require('@bin/commands/checkNewEpisodes')

module.exports = {
  record,
  schedule,
  pairwise,
  purge,
  hydrate,
  checkEpisodes,
  recordSeries,
  scheduleSeries,
  checkNewEpisodes,
}
