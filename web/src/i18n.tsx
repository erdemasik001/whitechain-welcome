import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const tr = {
  badgeName: 'Hoş geldin rozeti',
  heroTitle: 'İlk kontratını deploy ettin mi?',
  heroAccent: 'Rozetin seni bekliyor.',
  heroBody:
    "Tutorial'da deploy ettiğin kontratın adresini yapıştır. Kontratı senin cüzdanının deploy ettiğini zincir üzerinde kontrol edip sana devredilemeyen bir “Whitechain'e hoş geldin” NFT'si basıyoruz.",

  stepsTitle: '3 adımda rozetin',
  stepsSub: 'Yaklaşık bir dakika sürer',
  stepDone: 'Tamamlandı',
  stepNow: 'Şimdi',
  stepLocked: 'Bekliyor',
  badgeCaption: 'Devredilemez · Whitechain Sepolia',
  badgeNumber: 'Rozet no',
  badgeStatus: 'Durum',

  step1: 'Cüzdanını bağla',
  step1Hint: 'Kontratı deploy ettiğin cüzdanı kullan.',
  connectWith: '{name} ile bağlan',
  connecting: 'Bağlanıyor…',
  noWallet: 'Tarayıcında bir cüzdan bulamadık. MetaMask gibi bir cüzdan eklentisi kurup sayfayı yenile.',
  installWallet: "MetaMask'i indir",
  connectedAs: '{address} bağlı',
  disconnect: 'Çıkış',
  wrongNetwork: "Cüzdanın başka bir ağda. Devam etmek için Whitechain Sepolia'ya geç.",
  switchNetwork: "Whitechain Sepolia'ya geç",

  step2: 'Kontrat adresini yapıştır',
  step2Hint: 'Deploy çıktısındaki “Deployed to: 0x…” satırındaki adres.',
  check: 'Kontrol et',
  checking: 'Kontrol ediliyor…',
  invalidAddress: '0x ile başlayan 42 karakterlik bir kontrat adresi yapıştır.',
  noCode: "Bu adreste Whitechain Sepolia'da bir kontrat yok. Adresi ve ağı kontrol et.",
  notDeployer: 'Bu kontratı bağlı cüzdan deploy etmemiş.',
  notDeployerBy: 'Bu kontratı {deployer} deploy etmiş. Rozeti almak için o cüzdanı bağla.',
  factory:
    'Bu kontrat bir factory ya da CREATE2 ile deploy edilmiş. Rozet şimdilik doğrudan deploy edilen kontratlara veriliyor (forge create, Remix, deploy script).',
  checkFailed: 'Ağa ulaşamadık, birazdan tekrar dene.',
  verified: 'Doğrulandı: bu kontratı sen deploy etmişsin.',

  step3: 'Rozetini al',
  step3Hint: 'İşlem ücreti olarak çok küçük bir miktar test WBT ödersin.',
  claim: 'Rozeti al',
  confirmInWallet: 'Cüzdanında onayla…',
  confirming: 'Zincirde onaylanıyor…',
  rejected: 'İşlemi cüzdanında reddettin. Hazır olunca tekrar dene.',
  noGas: 'Cüzdanında işlem ücreti için yeterli test WBT yok.',
  getWbt: "Faucet'ten test WBT al",
  copyAddress: 'Adresimi kopyala',
  copied: 'Kopyalandı',
  faucetHint: "Faucet'te GitHub ile giriş yapıp cüzdan adresini yapıştır: 24 saatte bir 0,5 test WBT.",
  balance: 'Bakiyen: {amount} WBT',
  noWbtYet: "Cüzdanında hiç test WBT yok. Rozeti almak için önce faucet'ten biraz al.",
  alreadyClaimedError: 'Bu cüzdan rozetini zaten almış.',
  genericError: 'Bir şeyler ters gitti: {message}',

  welcomeTitle: "Whitechain'e hoş geldin!",
  welcomeBody: 'Builder #{id} rozetin cüzdanında. Devredilemez, yani hep senin.',
  alreadyTitle: 'Rozetin zaten sende',
  alreadyBody: 'Bu cüzdan Builder #{id} rozetini almış.',
  viewTx: 'İşlemi explorer’da gör',
  viewBadge: 'Rozeti explorer’da gör',
  nextTitle: 'Sırada ne var?',
  nextBody: 'Docs’taki örneklerle bir sonraki kontratını yaz ya da aylık challenge’a katıl.',

  preview: 'Önizleme',
  yours: 'Senin',
  noContractYet: 'Henüz kontratın yok mu?',
  watchTutorial: "Tutorial'ı izle",
  faucet: 'Faucet',
  docs: 'Docs',
  badgeContract: 'Rozet kontratı',
  tutorial: 'Tutorial',
  factNetwork: 'Ağ',
  factBlockTime: 'Blok süresi',
  factBlockTimeValue: '~1 sn',
  factMinted: 'Basılan rozet',
  notConfigured: 'Rozet kontratı henüz ayarlanmadı. VITE_BADGE_ADDRESS değerini .env dosyasına ekle.',
}

type Strings = typeof tr

const en: Strings = {
  badgeName: 'Welcome badge',
  heroTitle: 'Deployed your first contract?',
  heroAccent: 'Your badge is waiting.',
  heroBody:
    'Paste the address of the contract you deployed in the tutorial. We check on-chain that your wallet deployed it and mint you a non-transferable “Welcome to Whitechain” NFT.',

  stepsTitle: 'Your badge in 3 steps',
  stepsSub: 'Takes about a minute',
  stepDone: 'Done',
  stepNow: 'Now',
  stepLocked: 'Waiting',
  badgeCaption: 'Non-transferable · Whitechain Sepolia',
  badgeNumber: 'Badge no',
  badgeStatus: 'Status',

  step1: 'Connect your wallet',
  step1Hint: 'Use the wallet you deployed the contract with.',
  connectWith: 'Connect {name}',
  connecting: 'Connecting…',
  noWallet: 'No wallet found in this browser. Install a wallet extension such as MetaMask and reload.',
  installWallet: 'Get MetaMask',
  connectedAs: '{address} connected',
  disconnect: 'Disconnect',
  wrongNetwork: 'Your wallet is on another network. Switch to Whitechain Sepolia to continue.',
  switchNetwork: 'Switch to Whitechain Sepolia',

  step2: 'Paste your contract address',
  step2Hint: 'The address after “Deployed to: 0x…” in your deploy output.',
  check: 'Check',
  checking: 'Checking…',
  invalidAddress: 'Paste a 42-character contract address starting with 0x.',
  noCode: 'There is no contract at this address on Whitechain Sepolia. Check the address and network.',
  notDeployer: 'The connected wallet did not deploy this contract.',
  notDeployerBy: 'This contract was deployed by {deployer}. Connect that wallet to claim.',
  factory:
    'This contract was deployed through a factory or CREATE2. For now the badge only covers direct deploys (forge create, Remix, a deploy script).',
  checkFailed: 'Could not reach the network. Try again in a moment.',
  verified: 'Verified: you deployed this contract.',

  step3: 'Claim your badge',
  step3Hint: 'You pay a tiny transaction fee in test WBT.',
  claim: 'Claim badge',
  confirmInWallet: 'Confirm in your wallet…',
  confirming: 'Confirming on-chain…',
  rejected: 'You rejected the transaction in your wallet. Try again when ready.',
  noGas: 'Your wallet does not have enough test WBT for the fee.',
  getWbt: 'Get test WBT from the faucet',
  copyAddress: 'Copy my address',
  copied: 'Copied',
  faucetHint: 'On the faucet, sign in with GitHub and paste your wallet address: 0.5 test WBT every 24 hours.',
  balance: 'Your balance: {amount} WBT',
  noWbtYet: 'Your wallet has no test WBT yet. Get some from the faucet first to claim the badge.',
  alreadyClaimedError: 'This wallet has already claimed its badge.',
  genericError: 'Something went wrong: {message}',

  welcomeTitle: 'Welcome to Whitechain!',
  welcomeBody: 'Builder #{id} is in your wallet. It cannot be transferred, so it stays yours.',
  alreadyTitle: 'You already have your badge',
  alreadyBody: 'This wallet holds Builder #{id}.',
  viewTx: 'View transaction in explorer',
  viewBadge: 'View badge in explorer',
  nextTitle: 'What’s next?',
  nextBody: 'Write your next contract from the docs examples, or join the monthly challenge.',

  preview: 'Preview',
  yours: 'Yours',
  noContractYet: 'No contract yet?',
  watchTutorial: 'Watch the tutorial',
  faucet: 'Faucet',
  docs: 'Docs',
  badgeContract: 'Badge contract',
  tutorial: 'Tutorial',
  factNetwork: 'Network',
  factBlockTime: 'Block time',
  factBlockTimeValue: '~1 s',
  factMinted: 'Badges minted',
  notConfigured: 'The badge contract is not set yet. Add VITE_BADGE_ADDRESS to the .env file.',
}

export type Lang = 'tr' | 'en'
export type StringKey = keyof Strings
type Translate = (key: StringKey, vars?: Record<string, string | number>) => string

const dictionaries: Record<Lang, Strings> = { tr, en }
const STORAGE_KEY = 'welcome-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'tr' || saved === 'en') return saved
  } catch {
    // Storage can be blocked; fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

const I18nContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: Translate } | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  // Keep <html lang> in sync from the first render, so CSS uppercase follows the right language.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not critical.
    }
  }, [])

  const t = useCallback<Translate>(
    (key, vars) =>
      dictionaries[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars?.[name] ?? `{${name}}`)),
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
