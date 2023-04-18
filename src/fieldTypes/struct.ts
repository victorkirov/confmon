import { ConfigBranchNode, compileConfig } from '../compiler/config'
import { ExtractSchemaAsPrimitives, Schema } from '../compiler/types'

import { BaseType, TypeOptions } from './base'

export class StructType<T extends Schema> extends BaseType<ExtractSchemaAsPrimitives<T>> {
  private schema: T

  private config!: ConfigBranchNode<T>

  constructor(schema: T) {
    super()
    this.schema = schema
  }

  validate = (value: unknown): ExtractSchemaAsPrimitives<T> => {
    try {
      this.config.__applyValue(value)
    } catch (error) {
      const err = error as Error
      throw new Error(`StructType must be a valid object. Reason: ${err.message}`)
    }

    const validatedValue = this.config.getSync()

    return validatedValue
  }

  /** @internal */
  eject(): TypeOptions<ExtractSchemaAsPrimitives<T>> {
    this.config = compileConfig(this.schema)

    return super.eject()
  }

  /** @internal */
  subscribe(onChangeCallback: (newValue: ExtractSchemaAsPrimitives<T>) => void): void {
    this.config.confListen(onChangeCallback)
  }

  /** @internal */
  unsubscribe(onChangeCallback: (newValue: ExtractSchemaAsPrimitives<T>) => void): void {
    this.config.confRemoveListener(onChangeCallback)
  }
}
