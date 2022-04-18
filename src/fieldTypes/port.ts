import { BaseType } from './base'

export class PortType extends BaseType<number> {
  // validate = (value: unknown): number => {
  //   if (typeof value !== 'number') {
  //     throw new Error(`${this.constructor.name} must be a number`)
  //   }
  //   if (value < 0 || value > 65535) {
  //     throw new Error(`${this.constructor.name} must be between 0 and 65535`)
  //   }
  // }
}
