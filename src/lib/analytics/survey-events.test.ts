// Covers: FR-060, FR-061 (el momento, la opción y la pantalla; nunca el texto, el sujeto ni un id)
import { describe, expect, it } from 'vitest'
import {
  feedbackSentEvent,
  supportWhatsAppOpenedEvent,
  surveyAnsweredEvent,
  surveyDismissedEvent,
  surveyOfferedEvent,
} from './survey-events'

describe('los eventos de la encuesta', () => {
  it('ofrecida: solo el momento', () => {
    expect(surveyOfferedEvent('gave')).toEqual({
      name: 'survey_offered',
      props: { moment: 'gave' },
    })
  })

  it('respondida: el momento, la opción y si escribió, sin el texto ni la oferta', () => {
    const answer = {
      moment: 'adopted',
      option: 'somewhat',
      wrote: true,
      body: 'me ahorró las entrevistas',
      offerId: '6d1f5f0e-8a59-4f53-9a77-3c1c3e1a0b11',
    } as const
    expect(surveyAnsweredEvent(answer)).toEqual({
      name: 'survey_answered',
      props: { moment: 'adopted', option: 'somewhat', wrote: true },
    })
  })

  it('cerrada: solo el momento', () => {
    expect(surveyDismissedEvent('not_chosen')).toEqual({
      name: 'survey_dismissed',
      props: { moment: 'not_chosen' },
    })
  })
})

describe('Opinar y el WhatsApp de soporte', () => {
  it('una opinión: solo la pantalla', () => {
    expect(feedbackSentEvent('pet')).toEqual({ name: 'feedback_sent', props: { screen: 'pet' } })
  })

  it('el WhatsApp: solo la pantalla', () => {
    expect(supportWhatsAppOpenedEvent('my_pets')).toEqual({
      name: 'support_whatsapp_opened',
      props: { screen: 'my_pets' },
    })
  })
})
