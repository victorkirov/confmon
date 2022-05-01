import { BaseType } from './base'

export class ObjectType extends BaseType<unknown> {
  validate(value: unknown): unknown {
    if (typeof value === 'object') {
      return value
    }

    throw new Error(`Config value must be an object, got ${typeof value}`)
  }
}
