/**
 * Dev-only fake browser wallet, for clicking through the site against a local anvil fork.
 * Turned on by VITE_DEMO_WALLET in .env.local (see README, "Yerel test"). The account must be
 * unlocked on anvil (anvil_impersonateAccount) so anvil signs its transactions.
 *
 * main.tsx imports this before the wagmi config on purpose: wagmi asks for wallets when the
 * config is created and ignores announcements that arrive before its storage has loaded.
 * Production builds drop the code: it only runs behind import.meta.env.DEV.
 */
if (import.meta.env.DEV && import.meta.env.VITE_DEMO_WALLET) {
  announceDemoWallet(import.meta.env.VITE_DEMO_WALLET, import.meta.env.VITE_RPC_URL)
}

type RequestArgs = { method: string; params?: unknown[] }
type Listener = (...args: unknown[]) => void

export function announceDemoWallet(account: string, rpcUrl: string) {
  const listeners = new Map<string, Set<Listener>>()
  let id = 0

  const provider = {
    async request({ method, params }: RequestArgs) {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return [account]
        case 'wallet_requestPermissions':
        case 'wallet_getPermissions':
          return [{ parentCapability: 'eth_accounts' }]
        case 'wallet_switchEthereumChain':
        case 'wallet_addEthereumChain':
          return null
      }
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
      }).then((r) => r.json())
      if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code, data: res.error.data })
      return res.result
    },
    on(event: string, fn: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(fn)
    },
    removeListener(event: string, fn: Listener) {
      listeners.get(event)?.delete(fn)
    },
  }

  const detail = Object.freeze({
    info: {
      uuid: crypto.randomUUID(),
      name: 'Demo Wallet',
      rdns: 'local.demo.wallet',
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"%3E%3Crect width="20" height="20" rx="5" fill="%23f59e0b"/%3E%3C/svg%3E',
    },
    provider,
  })
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }))
  window.addEventListener('eip6963:requestProvider', announce)
  announce()
}
