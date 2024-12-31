import type { Config, StateHandler } from './config'
import type { EventHandler, EventOptions } from './event'

export const NO_STATE = Symbol('no state')

export type StateNode = {
  <T extends StateConfig | undefined>(
    config?: T
  ): T extends StateConfig ? StateNode : Promise<void>
  allows: bigint
  displayName: string
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
  on: (
    eventName: string,
    handler: (store?: any) => void | Promise<void>
  ) => void
  [Symbol.toPrimitive]: (hint: string) => bigint
} & bigint

export type StateGetter = {
  (store: any): any
  configure: (config: Partial<Config>) => void
} & {
  [key: string]: StateNode
}

export type StateConfig<T = any> = {
  allows?: StateNode | bigint
  validate?: (state: T) => boolean
  on?: {
    [event: string]: (store?: any) => void | Promise<void>
  }
  use?: (handler: StateHandler) => void
}
