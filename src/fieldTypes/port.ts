import { NumberType } from './number'

export class PortType extends NumberType {
  validate(this: PortType, value: unknown): number {
    const numberValue = super.validate(value)

    if (numberValue < 0 || numberValue > 65535) {
      throw new Error(`${this.constructor.name} must be between 0 and 65535`)
    }

    return numberValue
  }
}
