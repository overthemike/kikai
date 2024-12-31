import type { StateGetter } from '@/types/state'

export const machine = new Proxy(
  {},
  {
    get(target, prop: string): (states: StateGetter) => void {
      return (states) => {}
    }
  }
)
