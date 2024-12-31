import { nanoid } from 'nanoid'
import { Config } from '@/types/config'
import { $ } from '@/core/state'
import { valtioHandler } from '@/handlers/valtio'

export const configOverrides = new WeakMap<typeof $, Partial<Config>>()

export const defaultConfig: Config = {
  generateId: nanoid,
  stateHandler: valtioHandler
}

export function getConfig<K extends keyof Config>(key: K): Config[K] {
  const overrides = configOverrides.get($)!
  return overrides[key] ?? defaultConfig[key]
}

configOverrides.set($, {})
