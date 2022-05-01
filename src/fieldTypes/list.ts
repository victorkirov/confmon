import { BaseType, TypeOptions } from './base'

export class ListType<U, T extends BaseType<U>> extends BaseType<U[]> {
  private itemType: T

  constructor(itemType: T) {
    super()

    this.itemType = itemType
  }

  validate = async (value: unknown): Promise<U[]> => {
    if (!Array.isArray(value)) {
      throw new Error(`${this.constructor.name} must be an array`)
    }

    const result = await Promise.all(value.map(item => this.itemType.validate(item)))

    return result
  }

  /** @internal */
  eject(): TypeOptions<U[]>  {
    this.itemType.eject()

    return super.eject()
  }
}
