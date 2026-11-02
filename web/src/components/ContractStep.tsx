import type { FormEvent } from 'react'
import { explorerAddress } from '../config'
import type { CheckState } from '../flow'
import { useI18n } from '../i18n'
import { shortAddress } from '../lib/format'
import { Step, type StepState } from './Step'

type Props = {
  state: StepState
  value: string
  onChange: (value: string) => void
  check: CheckState
  onCheck: () => void
}

export function ContractStep({ state, value, onChange, check, onCheck }: Props) {
  const { t } = useI18n()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onCheck()
  }

  return (
    <Step number={2} title={t('step2')} hint={t('step2Hint')} state={state}>
      <form className="address-form" onSubmit={submit}>
        <input
          className="input mono"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0x…"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label={t('step2')}
          aria-invalid={check.phase === 'invalid' || (check.phase === 'done' && check.result.status !== 'ok')}
        />
        <button className="btn btn--secondary" type="submit" disabled={check.phase === 'checking' || !value.trim()}>
          {check.phase === 'checking' ? t('checking') : t('check')}
        </button>
      </form>
      <CheckMessage check={check} />
    </Step>
  )
}

function CheckMessage({ check }: { check: CheckState }) {
  const { t } = useI18n()

  switch (check.phase) {
    case 'idle':
    case 'checking':
      return null
    case 'invalid':
      return <p className="note note--error">{t('invalidAddress')}</p>
    case 'failed':
      return <p className="note note--error">{t('checkFailed')}</p>
  }

  const { result, target } = check
  switch (result.status) {
    case 'ok':
      return (
        <p className="status status--ok">
          {t('verified')}{' '}
          <a className="mono" href={explorerAddress(target)} target="_blank" rel="noreferrer">
            {shortAddress(target)}
          </a>
        </p>
      )
    case 'no-code':
      return <p className="note note--error">{t('noCode')}</p>
    case 'factory':
      return <p className="note note--warn">{t('factory')}</p>
    case 'not-deployer':
      return (
        <p className="note note--error">
          {result.deployer ? t('notDeployerBy', { deployer: shortAddress(result.deployer) }) : t('notDeployer')}
        </p>
      )
  }
}
