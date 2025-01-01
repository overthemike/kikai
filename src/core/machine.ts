import type { StateGetter } from '../types/state'
import type { StateHandler } from '../types/config'

type MachineGetter = {
  [key: string]: (states: StateGetter, handler?: StateHandler) => void
}

const machineHandlers = new WeakMap<StateGetter, StateHandler>()

export const machine = new Proxy({} as MachineGetter, {
  get(
    target,
    prop: string
  ): (states: StateGetter, handler?: StateHandler) => void {
    return (states, handler) => {
      if (handler) {
        machineHandlers.set(states, handler)
      }
    }
  }
})
