#!/usr/bin/env node
// Runs when the app container starts (Dockerfile), before the server. In production the database
// gets its migrations before the new code serves, so it never ships ahead of its schema (research
// R3 of #169). The migrations are additive: the old container keeps serving against a database one
// step ahead without breaking.
//   node scripts/deploy/migrate.mjs
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// Never `--include-seed`: the real site starts without the synthetic people (FR-006).
// `--skip-vault`: Vault holds the real app_url and cron_secret, loaded by hand
// (docs/puesta-en-marcha.md); a [db.vault] uncommented in config.toml would overwrite them.
export function migrationSteps(env) {
  if (env.DEPLOY_ENV !== 'production') return []
  if (!env.SUPABASE_DB_URL) {
    throw new Error(
      'Falta la variable de entorno SUPABASE_DB_URL: la cadena de la base del servidor, solo en ' +
        'producción (docs/puesta-en-marcha.md).',
    )
  }
  return [['supabase', ['db', 'push', '--db-url', env.SUPABASE_DB_URL, '--yes', '--skip-vault']]]
}

function main() {
  let steps
  try {
    steps = migrationSteps(process.env)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
  for (const [command, args] of steps) {
    const result = spawnSync(command, args, { stdio: 'inherit' })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
