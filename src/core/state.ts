// Types
type StateData = Record<string, unknown>
type Payload = Record<string, unknown> | unknown

type StateHandler<TData = StateData, TPayload = Payload> = (
  data: TData,
  payload: TPayload
) => TData

interface StateHandlers<TData extends StateData = StateData> {
  [eventName: string]: StateHandler<TData>
}

interface StateConfig<TData extends StateData = StateData> {
  initial?: TData
  validate?: <TData>(data: TData) => boolean
  on?: StateHandlers<TData>
}

interface StateMeta<TData extends StateData = StateData> {
  data: TData
  validate?: <TData>(data: TData) => boolean
  on?: StateHandlers<TData>
}

type StateMetaData<TData extends StateData = StateData> = {
  flag: bigint
  meta: StateMeta<TData>
  allowedStates?: bigint
  stateName?: string
  debug?: (key: string, value: unknown) => void
  history?: {
    log: (key: string, value: unknown) => void
    events: Record<string, unknown>
  }
}

type StateFunction<TData extends StateData = StateData> = ((
  data?: TData
) => unknown) & {
  getData: () => TData
  fire: (eventName: string, payload?: Payload) => TData
  set: <K extends keyof TData>(prop: K, value: TData[K]) => void
  allows?: StateFunction
  to?: StateFunction
  [Symbol.toPrimitive]: (hint: string) => bigint | string
}

// Internal state tracking
const MetaMap = new WeakMap<StateFunction<any>, StateMetaData<any>>()
let nextFlag = 1n
let currentState: StateFunction<any> | null = null

const getNextFlag = () => {
  const flag = nextFlag
  nextFlag <<= 1n
  return flag
}

export const state = <TData extends StateData = StateData>(
  config?: StateConfig<TData>
) => {
  const flag = getNextFlag()

  const instance = ((data?: TData) => {
    if (data === undefined) return true

    const metaData = MetaMap.get(instance)!
    if (metaData.meta.validate && !metaData.meta.validate(data)) {
      throw new Error(`Invalid data: ${data}`)
    }

    if (metaData.meta.data !== undefined) {
      metaData.meta.data = data
    }

    return instance
  }) as StateFunction<TData>

  // Initialize metadata
  MetaMap.set(instance, {
    flag,
    meta: {
      data: {} as TData,
      validate: config?.validate || ((_) => true),
      on: config?.on || {}
    }
  })

  // Add methods
  instance.getData = () => MetaMap.get(instance)!.meta.data

  instance.fire = (eventName: string, payload?: Payload) => {
    const metaData = MetaMap.get(instance)!
    const handler = metaData.meta.on?.[eventName]
    if (typeof handler === 'function') {
      return handler(metaData.meta.data, payload || {})
    }
    throw new Error(`No handler for event ${eventName}`)
  }

  instance.set = <K extends keyof TData>(prop: K, value: TData[K]) => {
    const metaData = MetaMap.get(instance)!
    if (metaData.meta.data) {
      metaData.meta.data[prop] = value
    }
  }

  instance[Symbol.toPrimitive] = (hint: string) => {
    const metaData = MetaMap.get(instance)!
    if (hint === 'number') return metaData.flag
    return instance.toString()
  }

  // Update metadata if config provided
  if (config) {
    const metaData = MetaMap.get(instance)!
    if (config.initial) {
      metaData.meta.data = config.initial
    }
    if (config.validate) {
      metaData.meta.validate = config.validate
    }
    if (config.on) {
      metaData.meta.on = config.on
    }
  }

  // Create proxy
  const instanceProxy = new Proxy(instance, {
    get(target, prop) {
      const metaData = MetaMap.get(target)!
      if (prop === 'allows' || prop === 'to') {
        return metaData.allowedStates
      }
      return Reflect.get(target, prop)
    },
    set(target, prop, value) {
      const metaData = MetaMap.get(target)!
      if (prop === 'allows' || prop === 'to') {
        metaData.allowedStates = BigInt(value)
      }
      return true
    }
  })

  // Check transition
  const prevState = currentState
  currentState = instanceProxy

  if (prevState) {
    const prevMetaData = MetaMap.get(prevState)
    if (prevMetaData?.allowedStates !== undefined) {
      if (!(prevMetaData.allowedStates & flag)) {
        throw new Error(
          `Invalid transition from ${prevMetaData.stateName} to ${
            MetaMap.get(instance)!.stateName
          }`
        )
      }
    }
  }

  return instanceProxy
}

const statesProxy = new Proxy<Record<string, StateFunction>>(
  {},
  {
    get: (target, prop: string) => {
      if (!(prop in target)) {
        const stateFn = ((config?: StateConfig<StateData>) => {
          const fn = state(config)
          const metaData = MetaMap.get(fn)!
          metaData.stateName = prop
          target[prop] = fn
          return fn
        }) as StateFunction

        // Initialize with base state
        const baseState = state()
        const baseMetaData = MetaMap.get(baseState)!
        baseMetaData.stateName = prop
        Object.assign(stateFn, baseState)
        target[prop] = stateFn

        return stateFn
      }
      return target[prop]
    }
  }
)

export default statesProxy

// Helper to access metadata (if needed externally)
export function getStateMetaData<TData extends StateData>(
  state: StateFunction<TData>
): StateMetaData<TData> | undefined {
  return MetaMap.get(state)
}
