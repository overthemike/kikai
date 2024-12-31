import type { StateNode } from '../types/state'
import type {
  EventHandler,
  EventOptions,
  EventResult,
  EventInfo
} from '../types/event'

export async function runEventHandlers(
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

export function addEvent(
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
