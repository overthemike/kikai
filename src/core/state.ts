import { NO_STATE, StateNode, StateGetter, StateConfig } from '../types/state'
import { StateHandler, Config } from '../types/config'
import { EventInfo } from '../types/event'
import { runEventHandlers } from './event'
import { nanoid } from 'nanoid'
import { valtioHandler } from '../handlers/valtio'
import { machineHandlers } from '../core/machine'

const states = new Map<string, StateNode>()
let currentFlag = 1n

const getNextFlag = () => {
  const flag = currentFlag
  currentFlag <<= 1n
  return flag
}

export const defaultConfig: Config = {
  generateId: nanoid,
  stateHandler: valtioHandler
}

export function getConfig<K extends keyof Config>(key: K): Config[K] {
  const overrides = configOverrides.get($)!
  return overrides[key] ?? defaultConfig[key]
}

const stateHandlers = new WeakMap<StateNode | StateGetter, StateHandler>()

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
    if (prop === 'configure') {
      return target[prop as keyof typeof target]
    }

    if (typeof prop === 'symbol') return undefined as any
    return createState(prop)
  },
  apply(target, thisArg, [store]: [object]): object {
    const metadata = stateMetadata.get($)!
    const prevState = metadata.currentState

    const handler =
      prevState !== NO_STATE
        ? (stateHandlers.get(prevState) ?? // State-specific handler
          getConfig('stateHandler')) // Global handler
        : getConfig('stateHandler')

    if (!handler) {
      throw new Error(
        'No state handler set. Did you forget to call $.configure({ handler: <handler>})?'
      )
    }

    return handler(store, {
      validate: prevState !== NO_STATE ? prevState.validate : undefined,
      currentState: prevState
    })
  }
})

export const stateMetadata = new WeakMap<
  typeof $,
  {
    currentState: StateNode | typeof NO_STATE
  }
>()

export function createState(stateName: string): StateNode {
  if (!states.has(stateName)) {
    const flag = getNextFlag()

    const node = Object.assign(
      function (config?: StateConfig): StateNode | Promise<void> {
        if (config) {
          if (config.allows) node.allows = config.allows
          if (config.validate) node.validate = config.validate
          if (config.use) node.use = config.use
          if (config.on) {
            Object.entries(config.on).forEach(([event, handler]) => {
              node.events.set(event, new Set([{ handler, options: {} }]))
            })
          }
          return node
        }

        return (async () => {
          const metadata = stateMetadata.get($)!
          const prevState = metadata.currentState

          if (prevState !== NO_STATE && !(prevState.allows & flag)) {
            throw new Error(
              `Invalid transition from ${prevState.displayName} to ${stateName}`
            )
          }

          const eventInfo: EventInfo = {
            state: stateName,
            currentState:
              prevState === NO_STATE ? NO_STATE : prevState.displayName
          }

          if (prevState !== NO_STATE) {
            const exitHandlers = prevState.events.get('exit')
            if (exitHandlers?.size) {
              await runEventHandlers(exitHandlers, eventInfo)
            }
          }

          metadata.currentState = node

          const enterHandlers = node.events.get('enter')
          if (enterHandlers?.size) {
            await runEventHandlers(enterHandlers, eventInfo)
          }
        })()
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
        on(eventName: string, handler: StateHandler) {
          if (!node.events.has(eventName)) {
            node.events.set(eventName, new Set())
          }
          node.events.get(eventName)!.add({ handler, options: {} })
        },
        [Symbol.toPrimitive]: () => flag
      }
    ) as StateNode

    states.set(stateName, node)
    return node
  }
  return states.get(stateName)!
}

export function state(name: string, config?: StateConfig): StateNode {
  const node = createState(name)
  if (config) {
    if (config.allows) node.allows = config.allows
    if (config.validate) node.validate = config.validate
    if (config.use) node.use?.(config.use)
    if (config.on) {
      Object.entries(config.on).forEach(([event, handler]) => {
        node.events.set(event, new Set([{ handler, options: {} }]))
      })
    }
  }
  return node
}

stateMetadata.set($, {
  currentState: NO_STATE
})

export const configOverrides = new WeakMap<object, Partial<Config>>()

configOverrides.set($, {})
