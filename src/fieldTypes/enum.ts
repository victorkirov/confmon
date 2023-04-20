import { BaseType } from './base'

export class EnumType<T extends readonly string[]> extends BaseType<T[number]> {
  private allowedValues: Set<T[number]>

  constructor(allowedValues: T) {
    super()

    this.allowedValues = new Set(allowedValues) as Set<T[number]>
  }

  validate = (value: unknown): T[number] => {
    if (typeof value !== 'string') {
      throw new Error(`${this.constructor.name} must be a string`)
    }

    const validValue = value as T[number]
    if (!this.allowedValues.has(validValue)) {
      throw new Error(`${this.constructor.name} must be one of ${Array.from(this.allowedValues).join(', ')}`)
    }

    return validValue
  }
}
