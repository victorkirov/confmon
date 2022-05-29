import { BaseType, TypeOptions } from './base'

export class ListType<T extends BaseType<unknown>> extends BaseType<(T extends BaseType<infer U> ? U : never)[]> {
  private itemType: T

  constructor(itemType: T) {
    super()

    this.itemType = itemType
  }

  validate = (value: unknown): (T extends BaseType<infer U> ? U : never)[] => {
    if (!Array.isArray(value)) {
      throw new Error(`${this.constructor.name} must be an array`)
    }

    const result = value.map(item => this.itemType.validate(item))

    return result as (T extends BaseType<infer U> ? U : never)[]
  }

  /** @internal */
  eject(): TypeOptions<(T extends BaseType<infer U> ? U : never)[]>  {
    this.itemType.eject()

    return super.eject()
  }
}
