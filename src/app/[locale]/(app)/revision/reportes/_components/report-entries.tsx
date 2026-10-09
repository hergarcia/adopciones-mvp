import { getLocale, getTranslations } from 'next-intl/server'
import { ReportDecision } from '@/components/moderation/report-decision'
import { ReportHistory, type ReportHistoryLine } from '@/components/moderation/report-history'
import { ReportItem } from '@/components/moderation/report-item'
import { Stamp } from '@/components/ui/stamp'
import { TextLink } from '@/components/ui/text-link'
import { momentDayLabel as dayLabel } from '@/lib/moderation/day-label'
import type { ReportHistoryEntry, ReportQueueItem } from '@/lib/moderation/types'
import { personRecordPath } from '@/lib/admin/paths'
import { waitingFor } from '@/lib/pets/waiting-for'
import { reportDecisionTexts } from '@/app/[locale]/_components/moderation-texts'

type Translate = Awaited<ReturnType<typeof getTranslations<'moderation.reports'>>>

async function historyLines(
  history: ReportHistoryEntry[],
  t: Translate,
  locale: string,
): Promise<ReportHistoryLine[]> {
  const reasons = await getTranslations('moderation.report.reasons')
  return history.map((entry, index) => {
    if (entry.kind === 'report') {
      return {
        key: `r${index}`,
        title: reasons(entry.reason),
        lines: [
          ...(entry.details === null ? [] : [t('quote', { text: entry.details })]),
          t('history_report', {
            resolution: entry.resolution,
            date: dayLabel(entry.resolvedAt, locale),
          }),
        ],
      }
    }
    return {
      key: `s${index}`,
      title: t('history_suspension', {
        lifted: entry.liftedAt === null ? 'no' : 'yes',
        from: dayLabel(entry.suspendedAt, locale),
        to: entry.liftedAt === null ? '' : dayLabel(entry.liftedAt, locale),
      }),
      lines: [
        t('quote', { text: entry.reason }),
        entry.suspendedBy === null
          ? t('history_suspended_by_deleted')
          : t('history_suspended_by', { name: entry.suspendedBy }),
      ],
    }
  })
}

function PersonName({ person, suspended }: { person: React.ReactNode; suspended: string | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>{person}</span>
      {suspended === null ? null : <Stamp tone="muted">{suspended}</Stamp>}
    </span>
  )
}

// Cada reporte de la lista, armado con sus textos: la página solo compone.
export async function reportEntries(items: ReportQueueItem[], now: Date) {
  const [t, reasons, locale] = await Promise.all([
    getTranslations('moderation.reports'),
    getTranslations('moderation.report.reasons'),
    getLocale(),
  ])
  const suspended = t('suspended')
  return Promise.all(
    items.map(async (item) => {
      const age = waitingFor(new Date(item.createdAt), now)
      const { reporter } = item
      const reported = (
        <TextLink href={personRecordPath(item.reported.publicId, 'reports')} placement="inline">
          {item.reported.name}
        </TextLink>
      )
      return {
        key: item.id,
        node: (
          <ReportItem
            reason={reasons(item.reason)}
            about={
              <PersonName
                person={t.rich('about', { name: () => reported })}
                suspended={item.reported.isSuspended ? suspended : null}
              />
            }
            age={t('age', { time: t('time', age) })}
            details={item.details === null ? null : t('quote', { text: item.details })}
            reporter={
              <PersonName
                person={
                  reporter === null
                    ? t('reporter_deleted')
                    : t.rich('reporter', {
                        name: () => (
                          <TextLink
                            href={personRecordPath(reporter.publicId, 'reports')}
                            placement="inline"
                          >
                            {reporter.name}
                          </TextLink>
                        ),
                      })
                }
                suspended={reporter?.isSuspended === true ? suspended : null}
              />
            }
            history={
              <ReportHistory
                entries={await historyLines(item.history, t, locale)}
                texts={{ title: t('history_title'), empty: t('no_history') }}
              />
            }
            decision={
              <ReportDecision
                reportId={item.id}
                publicId={item.reported.publicId}
                reportedSuspended={item.reported.isSuspended}
                texts={await reportDecisionTexts(item.reported.name)}
              />
            }
          />
        ),
      }
    }),
  )
}
