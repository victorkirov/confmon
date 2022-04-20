import { BaseType } from './base'

export class PortType extends BaseType<number> {
  validate = (value: unknown): number => {
    const numberValue = Number(value)

    if (Number.isNaN(numberValue)) {
      throw new Error(`${this.constructor.name} must be a valid number`)
    }

    if (numberValue < 0 || numberValue > 65535) {
      throw new Error(`${this.constructor.name} must be between 0 and 65535`)
    }

    return numberValue
  }
}
