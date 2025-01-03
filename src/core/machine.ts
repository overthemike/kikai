import { StateGetter, NO_STATE } from '../types/state'
import { StateHandler } from '../types/config'
import { createState, getConfig } from '../core/state'

type MachineConfig = {
  name?: string
  manageWith?: StateHandler
}

type MachineCallback<T = any> = (states: StateGetter) => T

function machine<T>(config: MachineConfig, callback: MachineCallback<T>): T {
  const states = new Proxy(
    {
      manage(store: any) {
        const handler = config.manageWith ?? getConfig('stateHandler')
        if (!handler) throw new Error('No state handler set')
        return handler(store, { currentState: NO_STATE })
      }
    } as StateGetter,
    {
      get(target, prop: string) {
        if (prop === 'manage') return target.manage
        return createState(prop)
      }
    }
  )

  return callback(states)
}
