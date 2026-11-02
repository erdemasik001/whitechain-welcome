import { useConnect, useConnection, useConnectors, useSwitchChain } from 'wagmi'
import { whitechainSepolia } from '../config'
import { useI18n } from '../i18n'
import { describeError } from '../lib/errors'
import { shortAddress } from '../lib/format'
import { Step, type StepState } from './Step'

export function WalletStep({ state }: { state: StepState }) {
  const { t } = useI18n()
  const { address, chainId } = useConnection()
  const connectors = useConnectors()
  const connect = useConnect()
  const switchChain = useSwitchChain()

  // Wallets that announce themselves (EIP-6963) come with a name and icon. The generic
  // "injected" connector is only worth showing when none did but window.ethereum exists.
  const announced = connectors.filter((c) => c.id !== 'injected')
  const hasLegacyWallet = typeof window !== 'undefined' && 'ethereum' in window
  const options = announced.length > 0 ? announced : hasLegacyWallet ? connectors : []

  const wrongNetwork = !!address && chainId !== whitechainSepolia.id
  const connectError = connect.error ? describeError(connect.error) : null

  return (
    <Step number={1} title={t('step1')} hint={t('step1Hint')} state={state}>
      {!address && options.length > 0 && (
        <div className="wallets">
          {options.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="btn btn--wallet"
              disabled={connect.isPending}
              // Connect first, switch network as a separate visible step: if someone declines
              // the network prompt they keep the connection and see the switch button below.
              onClick={() => connect.mutate({ connector })}
            >
              {connector.icon && <img src={connector.icon} alt="" width={20} height={20} />}
              {connect.isPending && connect.variables?.connector === connector
                ? t('connecting')
                : t('connectWith', { name: connector.id === 'injected' ? 'Wallet' : connector.name })}
            </button>
          ))}
        </div>
      )}

      {!address && options.length === 0 && (
        <p className="note">
          {t('noWallet')}{' '}
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
            {t('installWallet')}
          </a>
        </p>
      )}

      {connectError?.kind === 'other' && (
        <p className="note note--error">{t('genericError', { message: connectError.message })}</p>
      )}

      {address && wrongNetwork && (
        <div className="note note--warn">
          <p>{t('wrongNetwork')}</p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={switchChain.isPending}
            onClick={() => switchChain.mutate({ chainId: whitechainSepolia.id })}
          >
            {t('switchNetwork')}
          </button>
        </div>
      )}

      {address && !wrongNetwork && (
        <p className="status status--ok">{t('connectedAs', { address: shortAddress(address) })}</p>
      )}
    </Step>
  )
}
