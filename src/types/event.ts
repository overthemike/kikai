import { NO_STATE } from './state'

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
