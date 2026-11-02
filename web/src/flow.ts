import type { Address, Hash } from 'viem'
import type { ClaimError } from './lib/errors'
import type { CheckResult } from './lib/verify'

export type CheckState =
  | { phase: 'idle' }
  | { phase: 'invalid' }
  | { phase: 'checking' }
  | { phase: 'failed' }
  | { phase: 'done'; target: Address; result: CheckResult }

export type ClaimState =
  | { phase: 'idle' }
  | { phase: 'wallet' }
  | { phase: 'mining'; hash: Hash }
  | { phase: 'done'; hash: Hash }
  | { phase: 'error'; error: ClaimError }
