import { NO_STATE, StateNode, StateGetter } from '../types/state'
import { StateHandler, Config } from '../types/config'
import { EventInfo } from '../types/event'
import { runEventHandlers } from './event'
import { nanoid } from 'nanoid'
import { valtioHandler } from '../handlers/valtio'

const states = new Map<string, StateNode>()
let currentFlag = 1n

const getNextFlag = () => {
  const flag = currentFlag
  currentFlag <<= 1n
  return flag
}

export const configOverrides = new WeakMap<object, Partial<Config>>()

export const defaultConfig: Config = {
  generateId: nanoid,
  stateHandler: valtioHandler
}

const stateHandlers = new WeakMap<StateNode, StateHandler>()

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
      prevState !== NO_STATE && stateHandlers.has(prevState)
        ? stateHandlers.get(prevState)!
        : metadata.handler

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
    handler?: StateHandler<any, any>
  }
>()

function createState(stateName: string): StateNode {
  if (!states.has(stateName)) {
    const flag = getNextFlag()

    const node = Object.assign(
      async () => {
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
    return node
  }
  return states.get(stateName)!
}

export function getConfig<K extends keyof Config>(key: K): Config[K] {
  const overrides = configOverrides.get($)!
  return overrides[key] ?? defaultConfig[key]
}

stateMetadata.set($, {
  currentState: NO_STATE,
  handler: getConfig('stateHandler')
})
