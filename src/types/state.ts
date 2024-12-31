import type { StateHandler } from './config'
import type { EventHandler, EventOptions } from './event'

export const NO_STATE = Symbol('no state')

export type StateNode = {
  (): Promise<void>
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
  [Symbol.toPrimitive]: (hint: string) => bigint
} & bigint

export type StateGetter = {
  (store: any): any
  [key: string]: StateNode
}
