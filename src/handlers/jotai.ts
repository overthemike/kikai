import { StateHandler } from '../types/config'
import { NO_STATE } from '../types/state'
import { Getter, Setter } from 'jotai'

export const jotaiHandler: StateHandler = (atom, options) => {
  const original = atom[1]
  atom[1] = (get: Getter, set: Setter, value: unknown) => {
    if (options?.validate) {
      const nextState =
        typeof value === 'function'
          ? (value as (prev: unknown) => unknown)(get(atom[0]))
          : value

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
    return original(get, set, value)
  }
  return atom
}
