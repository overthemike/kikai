import type { StateGetter } from '../types/state'
import { $ } from '../core/state'

type MachineCallback<T> = ($: StateGetter) => {
  store: T
  states: Record<string, any>
}

export const machine = <T>(name: string, callback: MachineCallback<T>) => {
  // Implementation would need to match the proxy-based behavior
  // but expose it as a function interface
  return callback($)
}
