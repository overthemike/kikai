import { StateNode, StateGetter, NO_STATE } from '../types/state'
import { StateHandler, Config } from '../types/config'
import { createState, getConfig } from '../core/state'

export const machineHandlers = new WeakMap<Machine, StateHandler>()

type Machine = {
  apply: (store: any) => any
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
    if (!target[prop]) {
      target[prop] = new Proxy({} as Machine, {
        get(target, prop: string) {
          if (prop === 'use') {
            return (handler: StateHandler) => {
              machineHandlers.set(target, handler)
            }
          }
          if (prop === 'apply') {
            return function (store: any) {
              const handler =
                machineHandlers.get(target) ?? getConfig('stateHandler')
              if (!handler) {
                throw new Error('No state handler set')
              }
              return handler(store, { currentState: NO_STATE })
            }
          }
          return createState(prop)
        }
      })
    }
    return target[prop]
  },
  set(target, prop: string, value: (states: StateGetter) => any) {
    const machine = target[prop]
    if (machine) {
      currentMachine = machine
      value(machine)
      currentMachine = null
    }
    return true
  }
})
