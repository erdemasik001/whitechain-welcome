import { defineChain, isAddress, type Address } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors/injected'

const env = import.meta.env

export const EXPLORER_URL = 'https://explorer.testnet.whitechain.io'
export const EXPLORER_API = `${EXPLORER_URL}/api/v2`
export const FAUCET_URL = 'https://faucet.testnet.whitechain.io'
export const DOCS_URL = 'https://docs.whitechain.io'
export const TUTORIAL_URL =
  env.VITE_TUTORIAL_URL || 'https://docs.whitechain.io/getting-started/quick-start/deploy_with_foundry'

/** The site reads the chain through this RPC. Only overridden for local tests against anvil. */
const RPC_URL = env.VITE_RPC_URL || 'https://rpc.testnet.whitechain.io'

const badgeAddress = env.VITE_BADGE_ADDRESS ?? ''
export const BADGE_ADDRESS: Address | undefined = isAddress(badgeAddress) ? badgeAddress : undefined

export const whitechainSepolia = defineChain({
  id: 1874,
  name: 'Whitechain Sepolia',
  nativeCurrency: { name: 'WBT', symbol: 'WBT', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'Whitechain Explorer', url: EXPLORER_URL } },
  // One-second blocks; viem uses this to poll for receipts every ~0.5 s instead of 4 s.
  blockTime: 1_000,
  testnet: true,
})

export const config = createConfig({
  chains: [whitechainSepolia],
  // Browser wallets announce themselves (EIP-6963) and show up on their own.
  // `injected()` is the fallback for older wallets that only set window.ethereum.
  connectors: [injected()],
  transports: { [whitechainSepolia.id]: http(RPC_URL) },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

export const explorerAddress = (address: string) => `${EXPLORER_URL}/address/${address}`
export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`
export const explorerToken = (tokenId: bigint) =>
  `${EXPLORER_URL}/token/${BADGE_ADDRESS}/instance/${tokenId}`
