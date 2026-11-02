import { useEffect, useState } from 'react'
import { formatEther, type Address } from 'viem'
import { useBalance, useConnection } from 'wagmi'
import { FAUCET_URL, explorerTx, whitechainSepolia } from '../config'
import type { ClaimState } from '../flow'
import { useI18n } from '../i18n'
import { Step, type StepState } from './Step'

type Props = {
  state: StepState
  claim: ClaimState
  onClaim: () => void
}

export function ClaimStep({ state, claim, onClaim }: Props) {
  const { t } = useI18n()
  const { address } = useConnection()
  const busy = claim.phase === 'wallet' || claim.phase === 'mining'

  // Polled so the balance updates on its own after a visit to the faucet.
  const balance = useBalance({
    address,
    chainId: whitechainSepolia.id,
    query: { enabled: !!address && state === 'active', refetchInterval: 15_000 },
  })
  const empty = balance.data?.value === 0n

  const label =
    claim.phase === 'wallet' ? t('confirmInWallet') : claim.phase === 'mining' ? t('confirming') : t('claim')

  return (
    <Step number={3} title={t('step3')} hint={t('step3Hint')} state={state}>
      {empty && <p className="note note--warn">{t('noWbtYet')}</p>}

      <button className="btn btn--primary btn--large" type="button" disabled={busy} onClick={onClaim}>
        {busy && <span className="spinner" aria-hidden="true" />}
        {label}
      </button>

      {address && <FaucetHelp address={address} balance={balance.data?.value} />}

      {claim.phase === 'mining' && (
        <p className="status">
          <a href={explorerTx(claim.hash)} target="_blank" rel="noreferrer">
            {t('viewTx')}
          </a>
        </p>
      )}

      {claim.phase === 'error' && <ClaimErrorMessage claim={claim} />}
    </Step>
  )
}

function ClaimErrorMessage({ claim }: { claim: Extract<ClaimState, { phase: 'error' }> }) {
  const { t } = useI18n()
  const { error } = claim

  switch (error.kind) {
    case 'rejected':
      return <p className="note">{t('rejected')}</p>
    case 'no-gas':
      return (
        <p className="note note--error">
          {t('noGas')}{' '}
          <a href={FAUCET_URL} target="_blank" rel="noreferrer">
            {t('getWbt')}
          </a>
        </p>
      )
    case 'already-claimed':
      return <p className="note note--error">{t('alreadyClaimedError')}</p>
    case 'not-deployer':
      return <p className="note note--error">{t('notDeployer')}</p>
    case 'no-code':
      return <p className="note note--error">{t('noCode')}</p>
    case 'other':
      return <p className="note note--error">{t('genericError', { message: error.message })}</p>
  }
}

/** The fee is paid in test WBT: a way to the faucet, with the address to paste there. */
function FaucetHelp({ address, balance }: { address: Address; balance?: bigint }) {
  const { lang, t } = useI18n()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(address)
    } catch {
      // Some browsers (wallet in-app browsers, embedded views) block the clipboard API;
      // the older copy command still works in most of them.
      const field = document.createElement('textarea')
      field.value = address
      field.readOnly = true
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.append(field)
      field.select()
      const ok = document.execCommand('copy')
      field.remove()
      if (!ok) return
    }
    setCopied(true)
  }

  const amount =
    balance === undefined
      ? undefined
      : Number(formatEther(balance)).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: 4 })

  return (
    <div className="faucet">
      <a className="btn btn--outline" href={FAUCET_URL} target="_blank" rel="noreferrer">
        {t('getWbt')} <span aria-hidden="true">↗</span>
      </a>
      <button className="btn btn--outline" type="button" onClick={() => void copy()}>
        {copied ? t('copied') : t('copyAddress')}
      </button>
      <p className="status">
        {amount !== undefined && <span className="mono">{t('balance', { amount })}</span>}
        {amount !== undefined && ' · '}
        {t('faucetHint')}
      </p>
    </div>
  )
}
