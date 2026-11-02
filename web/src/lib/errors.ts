import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from 'viem'

export type ClaimError =
  | { kind: 'rejected' }
  | { kind: 'no-gas' }
  | { kind: 'already-claimed' }
  | { kind: 'not-deployer' }
  | { kind: 'no-code' }
  | { kind: 'other'; message: string }

/** Maps wallet and contract errors to something we can explain in plain words. */
export function describeError(error: unknown): ClaimError {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) return { kind: 'rejected' }
    if (error.walk((e) => e instanceof InsufficientFundsError)) return { kind: 'no-gas' }

    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError) {
      switch (revert.data?.errorName) {
        case 'AlreadyClaimed':
          return { kind: 'already-claimed' }
        case 'NotDeployer':
          return { kind: 'not-deployer' }
        case 'NoContractCode':
          return { kind: 'no-code' }
      }
    }
    return { kind: 'other', message: error.shortMessage }
  }
  // Some wallets throw plain EIP-1193 errors.
  if (typeof error === 'object' && error && 'code' in error && error.code === 4001) {
    return { kind: 'rejected' }
  }
  return { kind: 'other', message: error instanceof Error ? error.message : String(error) }
}
