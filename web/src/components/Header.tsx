import { useConnection, useDisconnect } from 'wagmi'
import { BADGE_ADDRESS, DOCS_URL, EXPLORER_URL, FAUCET_URL, TUTORIAL_URL, explorerAddress } from '../config'
import { useI18n, type Lang } from '../i18n'
import { shortAddress } from '../lib/format'

/** Logo files live in public/; BASE_URL keeps them working if the site is served from a sub-path. */
const BASE = import.meta.env.BASE_URL

/** Top row: logo and wordmark, text nav, wallet chip and language switch. */
export function Header() {
  const { lang, setLang, t } = useI18n()
  const { address } = useConnection()
  const disconnect = useDisconnect()

  const links = [
    { href: TUTORIAL_URL, label: t('tutorial') },
    { href: FAUCET_URL, label: t('faucet') },
    { href: DOCS_URL, label: t('docs') },
    { href: BADGE_ADDRESS ? explorerAddress(BADGE_ADDRESS) : EXPLORER_URL, label: 'Explorer' },
  ]

  return (
    <header className="topbar">
      <a className="brand" href="/">
        {/* Official Whitechain logo; phones get the icon alone to leave room for the wallet chip. */}
        <picture>
          <source media="(max-width: 420px)" srcSet={`${BASE}whitechain-icon.svg`} />
          <img className="brand-logo" src={`${BASE}whitechain-logo.svg`} alt="Whitechain" />
        </picture>
        <span className="brand-sub">{t('badgeName')}</span>
      </a>

      <nav className="topnav" aria-label="Whitechain">
        {links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </nav>

      <div className="topbar-actions">
        {address && (
          <button className="chip" type="button" onClick={() => disconnect.mutate()} title={t('disconnect')}>
            <span className="chip-dot" aria-hidden="true" />
            <span className="mono">{shortAddress(address)}</span>
            <span className="chip-action">{t('disconnect')}</span>
          </button>
        )}
        <div className="lang" role="group" aria-label="Language">
          {(['tr', 'en'] as Lang[]).map((code) => (
            <button
              key={code}
              type="button"
              className={code === lang ? 'is-active' : undefined}
              aria-pressed={code === lang}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
