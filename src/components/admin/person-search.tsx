'use client'

import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Input } from '@/components/ui/input'
import { usePersonSearch, type PeopleSearch } from '@/hooks/use-person-search'
import { personRecordPath } from '@/lib/admin/paths'
import type { SearchError } from '@/lib/admin/search-outcome'
import type { PersonResult as Person } from '@/lib/admin/types'
import { zoneName } from '@/lib/zones/zone-name'
import { PersonResult } from './person-result'

export type PersonSearchTexts = {
  title: string
  label: string
  submit: string
  resultsLabel: string
  none: string
  more: string
  suspended: string
  noZone: string
  /** Con `{name}` adentro, que la búsqueda reemplaza. */
  photoAlt: string
  errors: Record<SearchError, string>
}

type Props = {
  /** La acción de buscar, que pone la página. */
  search: PeopleSearch
  texts: PersonSearchTexts
}

const FIELD_ERRORS: ReadonlySet<SearchError> = new Set(['too_short', 'too_long'])

function zoneOf(person: Person, noZone: string) {
  return person.department === null
    ? noZone
    : zoneName({ department: person.department, locality: person.locality })
}

// Buscar a una persona por nombre (US4). Lo que falta escribir se dice en el campo; lo que falló, debajo,
// y el mismo «Buscar» reintenta: una acción aparece una sola vez (docs/10 §Principios).
export function PersonSearch({ search, texts }: Props) {
  const titleId = useId()
  const inputId = useId()
  const { query, setQuery, busy, outcome, submit } = usePersonSearch(search)
  const error = outcome?.kind === 'error' ? outcome.error : null
  const fieldError = error !== null && FIELD_ERRORS.has(error) ? texts.errors[error] : undefined
  const failure = error !== null && !FIELD_ERRORS.has(error) ? texts.errors[error] : null

  async function find() {
    const result = await submit()
    // El error de un campo no se anuncia solo: el foco vuelve al campo, que lo lee.
    if (result?.kind === 'error' && FIELD_ERRORS.has(result.error)) {
      document.getElementById(inputId)?.focus()
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    void find()
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="text-lg font-bold text-ink">
        {texts.title}
      </h2>
      <search>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm text-ink-muted">
            {texts.label}
          </label>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Input
                id={inputId}
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                error={fieldError}
              />
            </div>
            <Button type="submit" variant="secondary" loading={busy}>
              {texts.submit}
            </Button>
          </div>
          {failure === null ? null : <ErrorText announce>{failure}</ErrorText>}
        </form>
      </search>
      <div aria-live="polite" className="flex flex-col gap-4">
        {outcome?.kind === 'none' ? <p className="text-base text-ink">{texts.none}</p> : null}
        {outcome?.kind === 'results' ? (
          <>
            <ul
              aria-label={texts.resultsLabel}
              className="divide-y-2 divide-line border-y-2 border-line"
            >
              {outcome.people.map((person) => (
                <li key={person.publicId}>
                  <PersonResult
                    href={personRecordPath(person.publicId, 'search')}
                    name={person.name}
                    avatar={{
                      url: person.avatarUrl,
                      alt: texts.photoAlt.replace('{name}', person.name),
                    }}
                    zone={zoneOf(person, texts.noZone)}
                    suspended={person.isSuspended ? texts.suspended : null}
                  />
                </li>
              ))}
            </ul>
            {outcome.more ? <p className="text-sm text-ink-muted">{texts.more}</p> : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
