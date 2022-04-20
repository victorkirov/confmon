import { BaseType } from './base'

export class StringType extends BaseType<string> {
  validate = (value: unknown): string => {
    if (typeof value !== 'string') {
      throw new Error(`${this.constructor.name} must be a string`)
    }

    return value
  }
}
