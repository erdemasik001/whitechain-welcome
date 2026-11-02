import { useEffect, useRef, useState } from 'react'
import { getAddress, isAddress, zeroAddress } from 'viem'
import { useConnection, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { badgeAbi, rendererAbi } from './abi'
import { BadgeCard } from './components/BadgeCard'
import { ClaimStep } from './components/ClaimStep'
import { ContractStep } from './components/ContractStep'
import { Header } from './components/Header'
import { ArrowInIcon, type StepState } from './components/Step'
import { SuccessPanel } from './components/SuccessPanel'
import { WalletStep } from './components/WalletStep'
import { BADGE_ADDRESS, TUTORIAL_URL, whitechainSepolia } from './config'
import type { CheckState, ClaimState } from './flow'
import { useI18n } from './i18n'
import { describeError } from './lib/errors'
import { checkDeployment } from './lib/verify'

const chainId = whitechainSepolia.id
const badge = { address: BADGE_ADDRESS, abi: badgeAbi, chainId } as const

export function App() {
  const { t } = useI18n()
  const { address, chainId: walletChainId } = useConnection()
  const client = usePublicClient({ chainId })
  const writeContract = useWriteContract()

  const [input, setInput] = useState('')
  const [check, setCheck] = useState<CheckState>({ phase: 'idle' })
  const [claim, setClaim] = useState<ClaimState>({ phase: 'idle' })
  const [now] = useState(() => BigInt(Math.floor(Date.now() / 1000)))

  // --- What the contract already knows ----------------------------------------------------
  const badgeOf = useReadContract({
    ...badge,
    functionName: 'badgeOf',
    args: [address ?? zeroAddress],
    query: { enabled: !!BADGE_ADDRESS && !!address },
  })
  const totalSupply = useReadContract({
    ...badge,
    functionName: 'totalSupply',
    query: { enabled: !!BADGE_ADDRESS, refetchInterval: 30_000 },
  })
  const renderer = useReadContract({ ...badge, functionName: 'renderer', query: { enabled: !!BADGE_ADDRESS } })

  const tokenId = address && badgeOf.data && badgeOf.data > 0n ? badgeOf.data : undefined
  const ownedUri = useReadContract({
    ...badge,
    functionName: 'tokenURI',
    args: [tokenId ?? 0n],
    query: { enabled: tokenId !== undefined },
  })

  // Preview of the badge this person would get: next number, their contract once verified.
  const verifiedTarget = check.phase === 'done' && check.result.status === 'ok' ? check.target : undefined
  const previewUri = useReadContract({
    address: renderer.data,
    abi: rendererAbi,
    chainId,
    functionName: 'tokenURI',
    args: [(totalSupply.data ?? 0n) + 1n, address ?? zeroAddress, verifiedTarget ?? zeroAddress, now],
    query: { enabled: !!renderer.data && tokenId === undefined, placeholderData: (previous) => previous },
  })

  // --- Step 2: check the pasted address ---------------------------------------------------
  const walletReady = !!address && walletChainId === chainId
  const checkRun = useRef(0)

  async function runCheck(value = input) {
    const raw = value.trim()
    if (!address || !client) return
    if (!isAddress(raw, { strict: false })) {
      setCheck({ phase: 'invalid' })
      return
    }
    const target = getAddress(raw)
    const run = ++checkRun.current
    setCheck({ phase: 'checking' })
    try {
      const result = await checkDeployment(client, address, target)
      if (run === checkRun.current) setCheck({ phase: 'done', target, result })
    } catch {
      if (run === checkRun.current) setCheck({ phase: 'failed' })
    }
  }

  function onInputChange(value: string) {
    setInput(value)
    setClaim({ phase: 'idle' })
    checkRun.current++
    setCheck({ phase: 'idle' })
    // Pasting a full address is the common case: check it right away.
    if (walletReady && isAddress(value.trim(), { strict: false })) void runCheck(value)
  }

  // A different wallet means a different answer.
  useEffect(() => {
    checkRun.current++
    setCheck({ phase: 'idle' })
    setClaim({ phase: 'idle' })
  }, [address])

  // --- Step 3: claim ----------------------------------------------------------------------
  async function runClaim() {
    if (!BADGE_ADDRESS || !client || check.phase !== 'done' || check.result.status !== 'ok') return
    setClaim({ phase: 'wallet' })
    try {
      const hash = await writeContract.mutateAsync({
        ...badge,
        address: BADGE_ADDRESS,
        functionName: 'claim',
        args: [check.target, check.result.nonce],
      })
      setClaim({ phase: 'mining', hash })
      const receipt = await client.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new Error('Transaction reverted')
      await Promise.all([badgeOf.refetch(), totalSupply.refetch()])
      setClaim({ phase: 'done', hash })
    } catch (error) {
      const described = describeError(error)
      if (described.kind === 'already-claimed') void badgeOf.refetch()
      setClaim({ phase: 'error', error: described })
    }
  }

  // --- Layout -----------------------------------------------------------------------------
  const verified = verifiedTarget !== undefined
  const steps: Record<1 | 2 | 3, StepState> = {
    1: walletReady ? 'done' : 'active',
    2: !walletReady ? 'locked' : verified ? 'done' : 'active',
    3: walletReady && verified ? 'active' : 'locked',
  }
  const claimedCount = totalSupply.data
  const nextNumber = claimedCount === undefined ? undefined : claimedCount + 1n

  return (
    <div className="page">
      <Header />

      <main className="layout">
        <section className="intro">
          <h1>
            {t('heroTitle')} <span className="accent">{t('heroAccent')}</span>
          </h1>
          <p className="tagline" lang="en">
            Whitechain Sepolia · Soulbound NFT
          </p>
          <p className="lead">{t('heroBody')}</p>
          <p className="intro-cta">
            <span>{t('noContractYet')}</span>
            <a className="btn btn--outline" href={TUTORIAL_URL} target="_blank" rel="noreferrer">
              {t('watchTutorial')}
            </a>
          </p>
          {!BADGE_ADDRESS && <p className="note note--warn">{t('notConfigured')}</p>}
        </section>

        <aside className="art">
          <BadgeCard
            tokenUri={tokenId ? ownedUri.data : previewUri.data}
            owned={tokenId !== undefined}
            number={tokenId ?? nextNumber}
          />
        </aside>

        <section className="flow">
          {tokenId !== undefined ? (
            <SuccessPanel tokenId={tokenId} claimHash={claim.phase === 'done' ? claim.hash : undefined} />
          ) : (
            <div className="card">
              <div className="card-head">
                <span className="icon-circle">
                  <ArrowInIcon />
                </span>
                <div>
                  <h2>{t('stepsTitle')}</h2>
                  <p>{t('stepsSub')}</p>
                </div>
              </div>
              <ol className="steps">
                <WalletStep state={steps[1]} />
                <ContractStep
                  state={steps[2]}
                  value={input}
                  onChange={onInputChange}
                  check={check}
                  onCheck={() => void runCheck()}
                />
                <ClaimStep state={steps[3]} claim={claim} onClaim={() => void runClaim()} />
              </ol>
            </div>
          )}
        </section>
      </main>

      {/* The kit's logo band, used for the network facts */}
      <footer className="strip">
        <dl className="facts">
          <div>
            <dt>{t('factNetwork')}</dt>
            <dd>Sepolia</dd>
          </div>
          <div>
            <dt>Chain ID</dt>
            <dd>{chainId}</dd>
          </div>
          <div>
            <dt>{t('factBlockTime')}</dt>
            <dd>{t('factBlockTimeValue')}</dd>
          </div>
          <div>
            <dt>{t('factMinted')}</dt>
            <dd>{claimedCount?.toString() ?? '…'}</dd>
          </div>
        </dl>
      </footer>
    </div>
  )
}
