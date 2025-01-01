import { StateNode, StateGetter, NO_STATE } from '../types/state'
import { StateHandler } from '../types/config'
import { createState, getConfig } from '../core/state'

export type Machine = {
  use: (handler: StateHandler) => void
  apply: (store: any) => any
} & {
  [key: string]: StateNode
}

export type MachineGetter = {
  [key: string]: Machine & {
    states: StateGetter
  }
}

export const machineHandlers = new WeakMap<Machine, StateHandler>()

export const machine = new Proxy({} as MachineGetter, {
  get(target, prop: string) {
    const states = new Proxy({} as Machine, {
      get(target, prop: string) {
        if (prop === 'use') {
          return (handler: StateHandler) => {
            machineHandlers.set(states, handler)
          }
        }
        if (prop === 'apply') {
          return function (store: any) {
            const handler =
              machineHandlers.get(states) ?? getConfig('stateHandler')
            if (!handler) {
              throw new Error('No handler set for machine')
            }
            return handler(store, { currentState: NO_STATE })
          }
        }
        return createState(prop)
      }
    })
    return states
  }
})
