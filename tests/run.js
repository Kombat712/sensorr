console.log('')
console.log('========================================')
console.log('  Sensorr TV Series Test Suite')
console.log('========================================')
console.log('')

let passed = 0
let failed = 0

const tests = [
  { name: 'Database Schemas', file: './shared.database.test.js' },
  { name: 'Documents Normalization', file: './shared.documents.test.js' },
  { name: 'TMDB Endpoint Building', file: './shared.tmdb.test.js' },
  { name: 'Series Full Validation', file: './shared.series.test.js' },
  { name: 'Sensorr Episode Matching', file: './shared.sensorr-series.test.js' },
  { name: 'Episode Release Integration', file: './integration.tv-flow.test.js' },
  { name: 'UI Page Files Existence', file: './ui.pages.test.js' },
  { name: 'Routes and Navigation', file: './ui.routes.test.js' },
]

for (const { name, file } of tests) {
  try {
    process.stdout.write(`  ${name}                 `)
    require(file)
    process.stdout.write('\x1b[32m✅ PASS\x1b[0m\n')
    passed++
  } catch (e) {
    process.stdout.write('\x1b[31m❌ FAIL\x1b[0m\n')
    console.error(`      ${e.message}`)
    failed++
  }
}

console.log('')
console.log('========================================')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('========================================')
process.exit(failed > 0 ? 1 : 0)
