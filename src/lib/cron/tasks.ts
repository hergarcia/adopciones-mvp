export type TaskSchedule = { name: TaskName; everyMinutes: number; graceMinutes?: number }

// Las tareas solas, con el mismo nombre que su trabajo de `pg_cron` o que la ruta que anota su vuelta
// (data-model §Trabajos de pg_cron). Un test de base compara esta lista con `cron.job`.
export const TASKS = [
  { name: 'pet-lifecycle', everyMinutes: 5 },
  { name: 'identity-expire', everyMinutes: 5 },
  { name: 'identity-expiry-mail', everyMinutes: 5 },
  { name: 'follow-ups', everyMinutes: 60 },
  { name: 'admin-digest', everyMinutes: 1440 },
  { name: 'phone-records-purge', everyMinutes: 1440 },
  { name: 'daily-cleanup', everyMinutes: 1440 },
  { name: 'pet-renewal-links-purge', everyMinutes: 1440 },
  { name: 'withheld-numbers-purge', everyMinutes: 1440 },
  { name: 'cron-history-purge', everyMinutes: 1440 },
  // Vercel Cron en Hobby corre a cualquier minuto de su hora (±59 min).
  { name: 'vigilancia-diaria', everyMinutes: 1440, graceMinutes: 120 },
] as const satisfies readonly { name: string; everyMinutes: number; graceMinutes?: number }[]

export type TaskName = (typeof TASKS)[number]['name']
