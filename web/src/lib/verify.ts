import { getContractAddress, isAddressEqual, type Address, type Hash, type PublicClient } from 'viem'
import { EXPLORER_API } from '../config'

export type CheckResult =
  /** The wallet deployed this contract directly, with the deploy transaction at `nonce`. */
  | { status: 'ok'; nonce: bigint }
  /** No contract at this address on Whitechain Sepolia. */
  | { status: 'no-code' }
  /** Someone else deployed it. `deployer` is filled in when the explorer knows who. */
  | { status: 'not-deployer'; deployer?: Address }
  /** This wallet created it, but through a factory or CREATE2, which the badge does not accept. */
  | { status: 'factory' }

/** Above this many transactions we stop guessing nonces locally and ask the explorer instead. */
const LOCAL_SEARCH_LIMIT = 100_000

/**
 * Works out whether `wallet` deployed `target`, using the same rule as the badge contract:
 * a direct deploy lands at an address derived from the wallet and the deploy's nonce.
 */
export async function checkDeployment(
  client: PublicClient,
  wallet: Address,
  target: Address,
): Promise<CheckResult> {
  const code = await client.getCode({ address: target })
  if (!code || code === '0x') return { status: 'no-code' }

  // Every nonce this wallet has used so far is a candidate. Hashing them locally is instant
  // for normal wallets and needs nothing but the RPC.
  const txCount = await client.getTransactionCount({ address: wallet })
  const nonce = await findNonce(wallet, target, Math.min(txCount, LOCAL_SEARCH_LIMIT))
  if (nonce !== null) return { status: 'ok', nonce }

  // No match. The explorer tells us who created it, so the message can say what to do next.
  const creation = await fetchCreation(target)
  if (!creation) return { status: 'not-deployer' }

  const tx = creation.txHash
    ? await client.getTransaction({ hash: creation.txHash }).catch(() => null)
    : null
  const sentByWallet = !!tx && isAddressEqual(tx.from, wallet)

  // A direct deploy beyond the local search limit.
  if (
    tx &&
    sentByWallet &&
    tx.to === null &&
    isAddressEqual(getContractAddress({ from: wallet, nonce: BigInt(tx.nonce) }), target)
  ) {
    return { status: 'ok', nonce: BigInt(tx.nonce) }
  }
  if (sentByWallet || (creation.creator && isAddressEqual(creation.creator, wallet))) {
    return { status: 'factory' }
  }
  return { status: 'not-deployer', deployer: tx?.from ?? creation.creator }
}

async function findNonce(wallet: Address, target: Address, count: number): Promise<bigint | null> {
  for (let n = 0; n < count; n++) {
    if (isAddressEqual(getContractAddress({ from: wallet, nonce: BigInt(n) }), target)) return BigInt(n)
    // Let the page breathe on very busy wallets.
    if (n % 2000 === 1999) await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return null
}

async function fetchCreation(
  target: Address,
): Promise<{ creator?: Address; txHash?: Hash } | null> {
  try {
    const res = await fetch(`${EXPLORER_API}/addresses/${target}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    return {
      creator: data.creator_address_hash ?? undefined,
      txHash: data.creation_transaction_hash ?? data.creation_tx_hash ?? undefined,
    }
  } catch {
    return null
  }
}
