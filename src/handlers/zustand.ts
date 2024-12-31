import { StateHandler } from '../types/config'
import { NO_STATE } from '../types/state'

export const zustandHandler: StateHandler = (store, options) => {
  const original = store.setState
  store.setState = (updater: any) => {
    if (options?.validate) {
      const currentState = store.getState()
      // Handle both function and object updates
      const nextState =
        typeof updater === 'function'
          ? { ...currentState, ...updater(currentState) }
          : { ...currentState, ...updater }

      if (!options.validate(nextState)) {
        const stateName =
          options.currentState && options.currentState !== NO_STATE
            ? options.currentState.displayName
            : ''

        throw new Error(
          `Invalid state change${stateName ? ` in state ${stateName}` : ''}`
        )
      }
    }
    return original(updater)
  }
  return store
}
