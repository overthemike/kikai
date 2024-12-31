import type { StateGetter } from './state'

export type Machine = {
  [key: string]: (states: StateGetter) => void
}
