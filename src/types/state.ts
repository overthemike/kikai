export type StateData = Record<string, unknown>
export type Payload = Record<string, unknown> | unknown

export type StateHandler<TData = StateData, TPayload = Payload> = (
  data: TData,
  payload: TPayload
) => TData

export interface StateHandlers<TData extends StateData = StateData> {
  [eventName: string]: StateHandler<TData>
}

export interface StateConfig<TData extends StateData = StateData> {
  initial?: TData
  validate?: <TData>(data: TData) => boolean
  on?: StateHandlers<TData>
}

export interface StateMeta<TData extends StateData = StateData> {
  data: TData
  validate?: <TData>(data: TData) => boolean
  on?: StateHandlers<TData>
}

export type StateMetaData<TData extends StateData = StateData> = {
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

export type StateFunction<TData extends StateData = StateData> = ((
  data?: TData
) => unknown) & {
  getData: () => TData
  fire: (eventName: string, payload?: Payload) => TData
  set: <K extends keyof TData>(prop: K, value: TData[K]) => void
  allows?: StateFunction
  to?: StateFunction
  [Symbol.toPrimitive]: (hint: string) => bigint | string
}
