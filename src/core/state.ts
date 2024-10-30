// Symbols for internal state
export const $flag = Symbol('flag')
const $meta = Symbol('meta')
const $allowedStates = Symbol('allowedStates')
const $stateName = Symbol('stateName')
const $debug = Symbol('debug')
const $history = Symbol('history')

type StateData = Record<string, unknown>
type Payload = Record<string, unknown> | unknown

// Handler for state events
type StateHandler<TData = StateData, TPayload = Payload> = (
  data: TData,
  payload: TPayload
) => TData

// Event handlers for a state
interface StateHandlers<TData extends StateData> {
  [eventName: string]: StateHandler<TData>
}

interface StateConfig<TData extends StateData> {
  initial?: TData
  validate?: <TData>(data: TData) => boolean
  on?: StateHandlers<TData>
}

interface StateMeta<TData extends StateData> {
  data: TData
  validate?: <TData>(data: TData) => boolean
  on?: StateHandlers<TData>
}

type StateFunction<TData extends StateData = StateData> = ((
  data?: TData
) => unknown) & {
  [$flag]: bigint
  [$meta]: StateMeta<TData>
  [$allowedStates]?: bigint
  [$stateName]?: string
  [$debug]?: (key: string, value: unknown) => void
  [$history]?: debugHistory
  allows?: StateFunction | bigint
  to?: StateFunction | bigint
  debug?: boolean
  getData: () => StateData
  fire: (eventName: string, payload?: Payload) => TData
  set: <K extends keyof TData>(prop: K, value: TData[K]) => void
  [Symbol.toPrimitive]: (hint: string) => bigint | string
} & bigint

let nextFlag = 1n
const getNextFlag = () => {
  const flag = nextFlag
  nextFlag <<= 1n
  return flag
}

let currentState: StateFunction = (() => {}) as StateFunction
const transitionHistory: StateFunction[] = []
type debugHistory = {
  log: (key: string, value: unknown) => void
  events: Record<string, unknown>
}

const state = <TData extends StateData = StateData>(
  config?: StateConfig<TData>
) => {
  const flag = getNextFlag()

  const instance = ((data?: TData) => {
    if (data === undefined) return true

    if (config?.validate && !config.validate(data)) {
      throw new Error(`Invalid data: ${data}`)
    }

    if (instance[$meta].data !== undefined) {
      instance[$meta].data = data
    }

    return instance
  }) as StateFunction<TData>

  instance[$meta] = {
    data: {} as TData, // Initialize with empty object
    validate: config?.validate || ((_) => true),
    on: config?.on || {}
  }

  instance[Symbol.toPrimitive] = (hint: string) => {
    if (hint === 'number') return flag
    return instance.toString()
  }

  const meta = instance[$meta]

  if (config?.initial) {
    meta.data = config.initial
  }

  if (config?.validate) {
    meta.validate = config.validate
  }

  if (config?.on) {
    meta.on = config.on
  }

  instance[$flag] = flag

  const instanceProxy = new Proxy(instance, {
    set(target, prop, value) {
      if (prop === 'to' || prop === 'allows') {
        target[$allowedStates] = BigInt(value)
      }
      return true
    }
  })

  Object.defineProperties(instanceProxy, {
    [$flag]: {
      enumerable: false,
      configurable: false,
      writable: false
    },
    [$meta]: {
      enumerable: true,
      configurable: false,
      writable: true
    },
    [$debug]: {
      enumerable: false,
      configurable: false,
      writable: false
    },
    [$stateName]: {
      enumerable: true,
      configurable: false,
      writable: true
    },
    allows: {
      get() {
        return this[$allowedStates]
      },
      set(value) {
        this[$allowedStates] = BigInt(value)
      }
    },
    to: {
      get() {
        return this[$allowedStates]
      },
      set(value) {
        this[$allowedStates] = BigInt(value)
      }
    }
  })

  instance.getData = () => instance[$meta].data || {}

  // Fire method with correct generic constraint
  instance.fire = (eventName: string, payload?: Payload) => {
    const handler = instance[$meta]?.on?.[eventName]
    if (typeof handler === 'function') {
      const data = instance[$meta].data
      if (data !== null) {
        return handler(instance[$meta].data, payload || {})
      }
    }
    throw new Error(`No handler for event ${eventName}`)
  }

  instance.set = <K extends keyof TData>(prop: K, value: TData[K]) => {
    if (instance[$meta].data) {
      instance[$meta].data[prop] = value
    }
  }

  // Check transition
  const prevState = currentState as StateFunction<TData>
  currentState = instance as StateFunction<StateData>

  if (prevState && prevState !== null) {
    const allowedStates = prevState[$allowedStates]
    // Make sure we're dealing with bigints
    if (allowedStates !== undefined) {
      if (!(BigInt(allowedStates) & BigInt(flag))) {
        throw new Error(
          `Invalid transition from ${prevState[$stateName]} to ${instance[$stateName]}`
        )
      }
    }
  }

  return instanceProxy
}

/**
 * Helper proxy to easily create simple state functions
 */
const statesProxy = new Proxy<Record<string, StateFunction>>(
  {},
  {
    get: (target, prop: string) => {
      if (!(prop in target)) {
        // Create function that acts as both state and state creator
        const stateFn = ((config?: StateConfig<StateData>) => {
          if (config) {
            const fn = state(config)
            Object.defineProperty(fn, $stateName, { value: prop })
            target[prop] = fn
            return fn
          }
          const fn = state()
          Object.defineProperty(fn, $stateName, { value: prop })
          target[prop] = fn
          return fn
        }) as unknown as StateFunction

        // Initialize with base state
        const baseState = state()
        Object.defineProperty(baseState, $stateName, { value: prop })
        Object.assign(stateFn, baseState)
        target[prop] = stateFn

        return stateFn
      }
      return target[prop]
    }
  }
)

// const statesProxy = new Proxy<Record<string, StateFunction>>(
//   {},
//   {
//     get: (target, prop: string) => {
//       if (!(prop in target)) {
//         return (config?: StateConfig<any>) => {
//           const fn = state(config)
//           Object.defineProperty(fn, $stateName, { value: prop })
//           target[prop] = fn
//           return fn
//         }
//       }
//       return target[prop]
//     }
//   }
// )

const $ = statesProxy

export default $
