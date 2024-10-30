// Symbols for internal state
const $flag = Symbol('flag')
const $meta = Symbol('meta')
const $allowedStates = Symbol('allowedStates')
const $stateName = Symbol('stateName')

type StateData = Record<string, any>
type Payload = Record<string, any>

// Handler for state events
type StateHandler<TData = StateData, TPayload = Payload> = (
  data: TData,
  payload: TPayload
) => TData | (() => string)

// Event handlers for a state
interface StateHandlers<TData = StateData> {
  [eventName: string]: StateHandler<TData>
}

interface StateConfig {
  initial?: StateData
  validate?: (data: StateData) => boolean
  on?: StateHandlers
}

interface StateMeta {
  data: StateData | null
  validate?: (data: StateData) => boolean
  on?: StateHandlers
  allows?: StateFunction
  to?: StateFunction
}

type StateFunction = ((data?: StateData) => any) & {
  [$flag]: bigint
  [$meta]: StateMeta
  [$allowedStates]?: bigint
  [$stateName]?: string
  allows?: StateFunction
  to?: StateFunction
}

let nextFlag = 1n
const getNextFlag = () => {
  const flag = nextFlag
  nextFlag <<= 1n
  return flag
}

let currentState: StateFunction | null = null
const transitionHistory: StateFunction[] = []

const state = (config?: StateConfig) => {
  const flag = getNextFlag()

  const instance = ((data?: StateData) => {
    if (data === undefined) return true

    if (config?.validate && !config.validate(data)) {
      throw new Error(`Invalid data: ${data}`)
    }

    return instance
  }) as StateFunction

  ;(instance as any)[Symbol.toPrimitive] = (hint: string) => {
    if (hint === 'number') return flag
    return instance.toString()
  }

  instance[$meta] = {
    data: config?.initial || null,
    validate: config?.validate,
    on: config?.on
  }

  instance[$flag] = flag

  // Check transition
  const prevState = currentState as StateFunction
  currentState = instance

  const instanceProxy = new Proxy(instance, {
    set(target, prop, value) {
      if (prop === 'to' || prop === 'allows') {
        target[$allowedStates] = BigInt(value)
      }
      return true
    }
  })

  Object.defineProperties(instanceProxy, {
    name: {
      enumerable: true,
      configurable: false,
      writable: false
    },
    [$flag]: {
      enumerable: false,
      configurable: false,
      writable: false
    },
    [$meta]: {
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
        const fn = state()
        target[prop] = fn
        Object.defineProperty(fn, $stateName, { value: prop })
      }
      return target[prop]
    }
  }
)

const $ = statesProxy

export default $
