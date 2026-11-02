// Must stay first: registers the local demo wallet (dev only) before wagmi looks for wallets.
import './dev/demoWallet'
// Whitechain's own fonts (whitechain.io): Onest for text, JetBrains Mono for numbers and addresses.
import '@fontsource-variable/onest'
import '@fontsource-variable/jetbrains-mono'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config'
import { I18nProvider } from './i18n'
import { App } from './App'
import './styles.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <App />
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
