import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

export type StepState = 'done' | 'active' | 'locked'

type Props = {
  number: number
  title: string
  hint: string
  state: StepState
  children?: ReactNode
}

/** One row of the steps card: marker, title and hint, a status on the right, then its controls. */
export function Step({ number, title, hint, state, children }: Props) {
  const { t } = useI18n()
  const status = state === 'done' ? t('stepDone') : state === 'active' ? t('stepNow') : t('stepLocked')

  return (
    <li className={`step step--${state}`} aria-current={state === 'active' ? 'step' : undefined}>
      <span className="step-marker" aria-hidden="true">
        {state === 'done' ? <CheckIcon /> : number}
      </span>
      <div className="step-head">
        <h3 className="step-title">{title}</h3>
        <p className="step-hint">{hint}</p>
      </div>
      <span className="step-status">{status}</span>
      {state !== 'locked' && children && <div className="step-content">{children}</div>}
    </li>
  )
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** The kit's "arrow-down-right" glyph: something arriving in your wallet. */
export function ArrowInIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M5.5 5.5l9 9M14.5 7.5v7h-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
