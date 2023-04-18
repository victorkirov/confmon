import { ExtractSchemaAsPrimitives, Schema } from '../compiler/types'
import { ConfigBranchNode, compileConfig } from '../compiler/config'

import { BaseType, TypeOptions } from './base'

export class StructType<T extends Schema> extends BaseType<ExtractSchemaAsPrimitives<T>> {
  private schema: T

  private config!: ConfigBranchNode<T>

  constructor(schema: T) {
    super()
    this.schema = schema
  }

  validate = (value: unknown): ExtractSchemaAsPrimitives<T> => {
    this.config.__applyValue(value)

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
