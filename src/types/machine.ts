import type { StateGetter } from '@/types/state'

export type Machine = {
  [key: string]: (states: StateGetter) => void
}
