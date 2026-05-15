const request = require('request')

const ALLOWED_HOSTS = ['image.tmdb.org']

function imageProxy(req, res) {
  const url = req.query.url

  if (!url) {
    return res.status(400).send('Missing url parameter')
  }

  try {
    const parsed = new URL(url)
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return res.status(403).send('Host not allowed')
    }
  } catch (e) {
    return res.status(400).send('Invalid URL')
  }

  req.pipe(request(url)).pipe(res)
}

module.exports = imageProxy
