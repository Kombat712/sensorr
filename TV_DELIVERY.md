# TV delivery checklist (for project defense)

## 1) Install dependencies
If your environment has access to npm registry:

```bash
yarn install
# or
npm install
```

If you get `403 Forbidden`, this is a network/policy issue in the current environment, not a code issue.

## 2) Verify build
```bash
yarn build
```

## 3) Verify tests
```bash
node tests/shared.documents.test.js
node tests/shared.tmdb.test.js
node tests/shared.database.test.js
node tests/integration.tv-flow.test.js
```

## 4) Manual TV scenario
1. Open Settings -> Policy and set TV defaults (`quality`, `blackhole`, `excluded_terms`).
2. Add a TV series through Search (`tv`) and open series details page.
3. Mark series status and episode watched state.
4. Run background tasks:
   - `sensorr hydrate`
   - `sensorr checkEpisodes`
   - `sensorr schedule`
   - `sensorr record`
5. Confirm:
   - new episode entries appear in Calendar (`content_type=tv`)
   - torrent files for episodes are written into `tv.blackhole`
   - if Plex has series already, episode recording skips accordingly.

## 5) What to demonstrate to teacher
- Existing movie flow still works.
- New TV flow works end-to-end:
  - data model / TMDB / UI / calendar / background jobs / recording.
- Tests and build commands pass in a network-enabled environment.
