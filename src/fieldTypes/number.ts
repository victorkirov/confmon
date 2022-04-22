import { BaseType } from './base'

export class NumberType extends BaseType<number> {
  validate(this: NumberType, value: unknown): number {
    const numberValue = Number(value)

    if (Number.isNaN(numberValue)) {
      throw new Error(`${this.constructor.name} must be a valid number`)
    }

    return numberValue
  }
}
