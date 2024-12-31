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

export type StateHandler<OriginalStore = any, ManagedStore = any> = (
  store: OriginalStore,
  options?: {
    validate?: (store: OriginalStore) => boolean
    currentState: StateNode | typeof NO_STATE
  }
) => ManagedStore | Promise<ManagedStore>

export type StateGetter = {
  (store: any): any
  [key: string]: StateNode
}
