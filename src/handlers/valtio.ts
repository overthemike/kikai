import { StateHandler } from '@/types/config'
import { NO_STATE } from '@/types/state'

export const valtioHandler: StateHandler<object, object> = (store, options) => {
  return new Proxy(store, {
    set(target, prop, value) {
      if (options?.validate) {
        const validationState = { ...target, [prop]: value }
        if (!options.validate(validationState)) {
          const stateName =
            options.currentState && options.currentState !== NO_STATE
              ? options.currentState.displayName
              : ''

          throw new Error(
            `Invalid state change${stateName ? ` in state ${stateName}` : ''}`
          )
        }
      }

      return Reflect.set(target, prop, value)
    }
  })
}
