#!/usr/bin/env node
// The Vercel build command (vercel.json). In production the cloud database gets its migrations
// before the app compiles, so new code never ships ahead of its schema (research R3).
//   node scripts/deploy/build.mjs
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// Never `--include-seed`: the real site starts without the synthetic people (FR-006).
// `--skip-vault`: the cloud Vault holds the real app_url and cron_secret, loaded by hand
// (docs/puesta-en-marcha.md); a [db.vault] uncommented in config.toml would overwrite them.
export function buildSteps(env) {
  const build = ['pnpm', ['build']]
  if (env.VERCEL_ENV !== 'production') return [build]
  if (!env.SUPABASE_DB_URL) {
    throw new Error(
      'Falta la variable de entorno SUPABASE_DB_URL: la cadena del pooler en modo sesión del ' +
        'proyecto de Supabase, solo en Production (docs/puesta-en-marcha.md).',
    )
  }
  const push = ['exec', 'supabase', 'db', 'push', '--db-url', env.SUPABASE_DB_URL]
  return [['pnpm', [...push, '--yes', '--skip-vault']], build]
}

function main() {
  let steps
  try {
    steps = buildSteps(process.env)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
  for (const [command, args] of steps) {
    const result = spawnSync(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
