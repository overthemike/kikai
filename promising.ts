import { nanoid } from 'nanoid'

export const NO_STATE = Symbol('no state')

export type StateNode = {
  (): Promise<void>
  allows: bigint
  displayName: string // Change from name to displayName
  validate?: (args: any) => boolean
  events: Map<
    string,
    Set<{
      handler: EventHandler
      options: EventOptions
    }>
  >
  use?: (handler: StateHandler) => void
  flag: bigint
  [Symbol.toPrimitive]: (hint: string) => bigint
} & bigint

export type EventInfo = {
  state: string
  currentState: string | typeof NO_STATE
}

export type EventHandler = (info: EventInfo) => void | Promise<void>
export type EventOptions = {
  parallel?: boolean
}

export type EventResult = PromiseSettledResult<void>

export type EventMeta = {
  source: string
  timestamp: number
  currentState: string | typeof NO_STATE
  prevState?: string
  eventCorrelationId: string
  firedDuringTransition: boolean
}

export type StateHandler<OriginalStore = any, ManagedStore = any> = (
  store: OriginalStore,
  options?: {
    validate?: (store: OriginalStore) => boolean
    currentState: StateNode | typeof NO_STATE
  }
) => ManagedStore | Promise<ManagedStore>

type StateGetter = {
  (store: any): any
  [key: string]: StateNode
}

const states = new Map<string, StateNode>()
let currentFlag = 1n

const getNextFlag = () => {
  const flag = currentFlag
  currentFlag <<= 1n
  return flag
}

const stateHandlers = new WeakMap<StateNode, StateHandler>()
const configOverrides = new WeakMap<typeof $, Partial<Config>>()

function getConfig<K extends keyof Config>(key: K): Config[K] {
  const overrides = configOverrides.get($)!
  return overrides[key] || defaultConfig[key]
}

const generateId = getConfig('generateId')!()

function createState(stateName: string): StateNode {
  if (!states.has(stateName)) {
    const flag = getNextFlag()

    const node = Object.assign(
      async () => {
        const metadata = stateMetadata.get($)!
        const currentState = metadata.currentState

        if (currentState !== NO_STATE && !(currentState.allows & flag)) {
          throw new Error(
            `Invalid transition from ${currentState.displayName} to ${stateName}`
          )
        }

        const eventInfo: EventInfo = {
          state: stateName,
          currentState:
            currentState === NO_STATE ? NO_STATE : currentState.displayName
        }

        if (currentState !== NO_STATE) {
          const exitHandlers = currentState.events.get('exit')
          if (exitHandlers?.size) {
            await runEventHandlers(exitHandlers, eventInfo)
          }
        }

        metadata.currentState = node

        const enterHandlers = node.events.get('enter')
        if (enterHandlers?.size) {
          await runEventHandlers(enterHandlers, eventInfo)
        }
      },
      BigInt(0),
      {
        allows: 0n,
        displayName: stateName,
        events: new Map(),
        use(handler: StateHandler) {
          stateHandlers.set(node, handler)
        },
        flag,
        [Symbol.toPrimitive]: () => flag
      }
    ) as StateNode

    states.set(stateName, node)
    currentFlag <<= 1n
    return node
  }
  return states.get(stateName)!
}

async function runEventHandlers(
  handlers: Set<{ handler: EventHandler; options: EventOptions }>,
  info: EventInfo
): Promise<EventResult[]> {
  const parallelHandlers = [...handlers].filter((h) => h.options.parallel)
  const sequentialHandlers = [...handlers].filter((h) => !h.options.parallel)

  const results: EventResult[] = []

  if (parallelHandlers.length > 0) {
    const parallelResults = await Promise.allSettled(
      parallelHandlers.map(({ handler }) => handler(info))
    )
    results.push(...parallelResults)
  }

  for (const { handler } of sequentialHandlers) {
    try {
      const result = await handler(info)
      results.push({ status: 'fulfilled', value: result })
    } catch (error) {
      results.push({ status: 'rejected', reason: error })
    }
  }

  return results
}

function addEvent(
  node: StateNode,
  eventName: string,
  handler: EventHandler,
  options: EventOptions = {}
) {
  if (!node.events.has(eventName)) {
    node.events.set(eventName, new Set())
  }
  node.events.get(eventName)!.add({ handler, options })
}

// Create a function as the base
const stateGetterBase = function (store: any) {} as StateGetter

Object.defineProperty(stateGetterBase, 'configure', {
  enumerable: false,
  value: (overrides: Partial<Config>) => {
    const currentOverrides = configOverrides.get($)
    configOverrides.set($, { ...currentOverrides, ...overrides })
  }
})

export const $ = new Proxy(stateGetterBase, {
  get(target, prop: string | symbol): StateNode {
    if (typeof prop === 'symbol') return undefined as any
    return createState(prop)
  },
  apply(target, thisArg, [store]: [object]): object {
    const metadata = stateMetadata.get($)!
    const currentState = metadata.currentState

    const handler =
      currentState !== NO_STATE && stateHandlers.has(currentState)
        ? stateHandlers.get(currentState)!
        : metadata.handler

    if (!handler) {
      throw new Error('No state handler set. Did you forget to call $.use()?')
    }

    return handler(store, {
      validate: currentState !== NO_STATE ? currentState.validate : undefined,
      currentState
    })
  }
})

configOverrides.set($, {})

const valtioHandler: StateHandler<object, object> = (store, options) => {
  return new Proxy(store, {
    set(target, prop, value) {
      if (options?.validate) {
        const validationState = { ...target, [prop]: value }
        if (!options.validate(validationState)) {
          const stateName =
            options.currentState && options.currentState !== NO_STATE
              ? options.currentState.name
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

const stateMetadata = new WeakMap<
  typeof $,
  {
    currentState: StateNode | typeof NO_STATE
    handler?: StateHandler<any, any>
    generateId?: () => string
  }
>()

// Initialize metadata
stateMetadata.set($, {
  currentState: NO_STATE
})

type Config = {
  generateId?: () => string
  stateHandler?: StateHandler
}

const defaultConfig: Config = {
  generateId: nanoid,
  stateHandler: valtioHandler
}

export function setHandler(handler: StateHandler) {
  const metadata = stateMetadata.get($)!
  metadata.handler = handler
}
