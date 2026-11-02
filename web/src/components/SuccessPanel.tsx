import type { Hash } from 'viem'
import { DOCS_URL, explorerToken, explorerTx } from '../config'
import { useI18n } from '../i18n'
import { CheckIcon } from './Step'

type Props = {
  tokenId: bigint
  /** Set when the claim happened in this visit, so we can celebrate and link the transaction. */
  claimHash?: Hash
}

export function SuccessPanel({ tokenId, claimHash }: Props) {
  const { t } = useI18n()
  const id = tokenId.toString()

  return (
    <section className="card success" aria-live="polite">
      <span className="success-icon" aria-hidden="true">
        <CheckIcon />
      </span>
      <h2>{claimHash ? t('welcomeTitle') : t('alreadyTitle')}</h2>
      <p>{claimHash ? t('welcomeBody', { id }) : t('alreadyBody', { id })}</p>
      <div className="success-links">
        <a className="btn btn--primary" href={explorerToken(tokenId)} target="_blank" rel="noreferrer">
          {t('viewBadge')}
        </a>
        {claimHash && (
          <a className="btn btn--secondary" href={explorerTx(claimHash)} target="_blank" rel="noreferrer">
            {t('viewTx')}
          </a>
        )}
      </div>
      <div className="success-next">
        <h3>{t('nextTitle')}</h3>
        <p>
          {t('nextBody')}{' '}
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            docs.whitechain.io
          </a>
        </p>
      </div>
    </section>
  )
}
