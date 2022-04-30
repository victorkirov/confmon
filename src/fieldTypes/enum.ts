import { BaseType } from './base'

export class EnumType extends BaseType<string> {
  private allowedValues: Set<string>

  constructor(allowedValues: string[]) {
    super()

    this.allowedValues = new Set(allowedValues)
  }

  validate = (value: unknown): string => {
    if (typeof value !== 'string') {
      throw new Error(`${this.constructor.name} must be a string`)
    }

    if (!this.allowedValues.has(value)) {
      throw new Error(`${this.constructor.name} must be one of ${Array.from(this.allowedValues).join(', ')}`)
    }

    return value
  }
}
