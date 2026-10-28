import { describe, expect, it } from 'vitest'
import { exitSummaryBlocks, type ExitSummaryRow } from './exit-summary'

const zero = { publish: 0, apply: 0, self: 0 }

function row(partial: Partial<ExitSummaryRow> & Pick<ExitSummaryRow, 'option'>): ExitSummaryRow {
  return { level: 'phone', origin: 'publish', asked: 0, skipped: 0, chosen: 0, ...partial }
}

describe('exitSummaryBlocks', () => {
  // Covers: US3-AS1, FR-017, FR-018
  it('suma las cuentas de los tres orígenes una vez y cada opción en total y por origen', () => {
    const counts = {
      publish: { asked: 5, skipped: 1 },
      apply: { asked: 4, skipped: 2 },
      self: { asked: 3, skipped: 0 },
    } as const
    const chosen: Record<string, Partial<Record<keyof typeof counts, number>>> = {
      no_number: { publish: 2, apply: 1 },
      no_code: { self: 3 },
      groups: { publish: 1, apply: 1 },
    }
    const rows = (['publish', 'apply', 'self'] as const).flatMap((origin) =>
      (['no_number', 'no_code', 'later', 'groups', 'other'] as const).map((option) =>
        row({ origin, option, ...counts[origin], chosen: chosen[option]?.[origin] ?? 0 }),
      ),
    )

    const [phone] = exitSummaryBlocks(rows)
    expect(phone).toEqual({
      level: 'phone',
      asked: 12,
      answered: 8,
      skipped: 3,
      options: [
        { option: 'no_number', total: 3, byOrigin: { publish: 2, apply: 1, self: 0 } },
        { option: 'no_code', total: 3, byOrigin: { publish: 0, apply: 0, self: 3 } },
        { option: 'later', total: 0, byOrigin: zero },
        { option: 'groups', total: 2, byOrigin: { publish: 1, apply: 1, self: 0 } },
        { option: 'other', total: 0, byOrigin: zero },
      ],
    })
  })

  // Covers: US3-AS4, US3-AS5
  it('un nivel que la base no devolvió sale igual, en cero, con sus cinco opciones', () => {
    const blocks = exitSummaryBlocks([
      row({ level: 'identity', origin: 'self', asked: 2, skipped: 1, option: 'later', chosen: 1 }),
    ])
    expect(blocks).toEqual([
      {
        level: 'phone',
        asked: 0,
        answered: 0,
        skipped: 0,
        options: ['no_number', 'no_code', 'later', 'groups', 'other'].map((option) => ({
          option,
          total: 0,
          byOrigin: zero,
        })),
      },
      {
        level: 'identity',
        asked: 2,
        answered: 1,
        skipped: 1,
        options: [
          { option: 'no_id_photos', total: 0, byOrigin: zero },
          { option: 'later', total: 1, byOrigin: { ...zero, self: 1 } },
          { option: 'too_much', total: 0, byOrigin: zero },
          { option: 'groups', total: 0, byOrigin: zero },
          { option: 'other', total: 0, byOrigin: zero },
        ],
      },
    ])
  })

  it('cada nivel cuenta solo lo suyo, y las opciones van en el orden en que se ofrecen', () => {
    const blocks = exitSummaryBlocks([
      row({ level: 'identity', origin: 'apply', asked: 7, skipped: 2, option: 'other', chosen: 4 }),
      row({ level: 'identity', origin: 'apply', asked: 7, skipped: 2, option: 'later', chosen: 1 }),
      row({ level: 'phone', origin: 'apply', asked: 3, skipped: 1, option: 'later', chosen: 2 }),
    ])
    expect(blocks.map((block) => block.level)).toEqual(['phone', 'identity'])
    expect(blocks[0]).toMatchObject({ asked: 3, answered: 2, skipped: 1 })
    expect(blocks[1]).toMatchObject({ asked: 7, answered: 5, skipped: 2 })
    expect(blocks[1]?.options.map((option) => [option.option, option.byOrigin.apply])).toEqual([
      ['no_id_photos', 0],
      ['later', 1],
      ['too_much', 0],
      ['groups', 0],
      ['other', 4],
    ])
    expect(blocks[0]?.options[2]).toEqual({
      option: 'later',
      total: 2,
      byOrigin: { ...zero, apply: 2 },
    })
  })
})
