const { from, EMPTY } = require('rxjs')
const { mergeMap } = require('rxjs/operators')
const { request } = require('universal-rxjs-ajax')
const Config = require('@server/store/config')
const XZNAB = require('@shared/services/XZNAB')
const { paths } = require('@shared/utils/constants')
const fs = require('fs')
const path = require('path')

function grabSeries(req, res) {
  const { guid } = req.body

  if (!guid) {
    return res.status(400).send({ error: 'Missing guid' })
  }

  const xznabConfig = (Config.payload.xznabs || []).find(x => !x.disabled)

  if (!xznabConfig) {
    return res.status(400).send({ error: 'No active XZNAB indexer' })
  }

  const xznab = new XZNAB(xznabConfig, {})
  const blackhole = Config.payload.seriesBlackhole || Config.payload.blackhole || '/tmp'

  const link = `${xznab.url}?apikey=${xznab.key}&t=get&id=${guid}`

  request({ url: link, responseType: 'arraybuffer' }).pipe(
    mergeMap(response => {
      const filename = path.join(blackhole, `${guid}.nzb`)
      fs.writeFileSync(filename, Buffer.from(response.response))
      return from(Promise.resolve({ filename }))
    }),
  ).subscribe(
    ({ filename }) => res.send({ success: true, filename }),
    (err) => res.status(500).send({ error: err.message }),
  )
}

module.exports = grabSeries
