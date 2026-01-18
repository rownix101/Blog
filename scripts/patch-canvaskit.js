import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const targets = [
  join('node_modules', 'canvaskit-wasm', 'bin', 'full', 'canvaskit.js'),
  join(
    'node_modules',
    'astro-og-canvas',
    'node_modules',
    'canvaskit-wasm',
    'bin',
    'full',
    'canvaskit.js'
  ),
]

const line = "const __dirname = new URL('.', import.meta.url).pathname"

for (const target of targets) {
  if (!existsSync(target)) continue

  const data = readFileSync(target, 'utf8')
  const lines = data.split('\n').filter((value) => value !== line)
  const next = [line, '', ...lines].join('\n')

  if (next !== data) {
    writeFileSync(target, next)
  }
}
