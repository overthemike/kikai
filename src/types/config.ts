import { type StateNode, NO_STATE } from '@/types/state'

export type StateHandler<OriginalStore = any, ManagedStore = any> = (
  store: OriginalStore,
  options?: {
    validate?: (store: OriginalStore) => boolean
    currentState: StateNode | typeof NO_STATE
  }
) => ManagedStore | Promise<ManagedStore>

export type Config = {
  generateId?: () => string
  stateHandler?: StateHandler
}
