import { BaseType } from './base'

export class ObjectType extends BaseType<Record<string, unknown>> {
  validate(this: ObjectType, value: unknown): Record<string, unknown> {
    // TODO: Implement this properly or remove
    if (typeof value === 'string') {
      return JSON.parse(value)
    }
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>
    }

    throw new Error(`Config value must be an object or stringified JSON object, got ${typeof value}`)
  }
}
