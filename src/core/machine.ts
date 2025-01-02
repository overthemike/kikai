import { StateNode, StateGetter, NO_STATE } from '../types/state'
import { StateHandler, Config } from '../types/config'
import { createState, getConfig } from '../core/state'

export const machineHandlers = new WeakMap<Machine, StateHandler>()

type Machine = {
  use: (handler: StateHandler) => void
  apply: (store: any) => any
  configure: (config: Partial<Config>) => void
  (states: StateGetter): any
} & {
  [key: string]: StateNode
}

type MachineGetter = {
  [key: string]: Machine
}

// Track current machine being defined
let currentMachine: Machine | null = null

export function manageWith(stateManager: StateHandler) {
  if (!currentMachine) {
    throw new Error(
      'manageWith() can only be called within a machine definition'
    )
  }
  machineHandlers.set(currentMachine, stateManager)
}

export const machine = new Proxy({} as MachineGetter, {
  get(target, prop: string) {
    const states = new Proxy(
      {
        configure: (config: Partial<Config>) => {
          // Handle configuration
        }
      } as Machine,
      {
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
                throw new Error('No state handler set')
              }
              return handler(store, { currentState: NO_STATE })
            }
          }
          return createState(prop)
        }
      }
    )

    return function (callback: (states: StateGetter) => any) {
      currentMachine = states
      const result = callback(states)
      currentMachine = null
      return result
    }
  }
})
