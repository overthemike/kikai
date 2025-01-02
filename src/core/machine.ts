import { StateNode, StateGetter, NO_STATE } from '../types/state'
import { StateHandler, Config } from '../types/config'
import { createState, getConfig } from '../core/state'

type Machine = {
  use: (handler: StateHandler) => void
  apply: (store: any) => any
  configure: (config: Partial<Config>) => void
  (store: any): any
} & {
  [key: string]: StateNode
}

export type MachineGetter = {
  [key: string]: Machine & {
    states: StateGetter
  }
}

export const machineHandlers = new WeakMap<Machine, StateHandler>()

let currentMachine: Machine | null = null

export function manageWith(handler: StateHandler) {
  if (!currentMachine) {
    throw new Error('use() can only be called within a machine definition')
  }
  machineHandlers.set(currentMachine, handler)
}

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

    // Return function that sets context, runs callback, and cleans up
    return function (callback: (states: StateGetter) => void) {
      currentMachine = states
      const result = callback(states) // Get whatever the callback returns
      currentMachine = null
      return result // Pass through the return value
    }
  }
})
