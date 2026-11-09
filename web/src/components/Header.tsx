import { useConnection, useDisconnect } from 'wagmi'
import { BADGE_ADDRESS, DOCS_URL, EXPLORER_URL, FAUCET_URL, TUTORIAL_URL, explorerAddress } from '../config'
import { useI18n, type Lang } from '../i18n'
import { shortAddress } from '../lib/format'
import { useTheme } from '../theme'

/** Logo files live in public/; BASE_URL keeps them working if the site is served from a sub-path. */
const BASE = import.meta.env.BASE_URL

/** Top row: logo and wordmark, text nav, wallet chip and language switch. */
export function Header() {
  const { lang, setLang, t } = useI18n()
  const { address } = useConnection()
  const disconnect = useDisconnect()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

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
          <source media="(max-width: 420px)" srcSet={`${BASE}whitechain-icon${dark ? '-dark' : ''}.svg`} />
          <img className="brand-logo" src={`${BASE}whitechain-logo${dark ? '-dark' : ''}.svg`} alt="Whitechain" />
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
        <button
          type="button"
          className="theme-switch"
          role="switch"
          aria-checked={dark}
          aria-label={t('darkMode')}
          title={t('darkMode')}
          onClick={toggle}
        >
          <span className="theme-track">
            <span className="theme-thumb" aria-hidden="true">
              {dark ? (
                <svg viewBox="0 0 16 16"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="3" fill="currentColor" />
                  <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
                </svg>
              )}
            </span>
          </span>
        </button>
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
