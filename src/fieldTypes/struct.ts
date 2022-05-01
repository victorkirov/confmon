import { BaseType, TypeOptions } from './base'

import { ExtractSchemaAsPrimitives, Schema } from '../compiler/types'
import { ConfigBranchNode, compileConfig } from '../compiler/config'

export class StructType<T extends Schema> extends BaseType<ExtractSchemaAsPrimitives<T>> {
  private schema: T

  private config!: ConfigBranchNode<T>

  constructor(schema: T) {
    super()
    this.schema = schema
  }

  validate = async (value: unknown): Promise<ExtractSchemaAsPrimitives<T>> => {
    await this.config.__applyValue(value)

    const validatedValue = await this.config

    return validatedValue
  }

  /** @internal */
  eject(): TypeOptions<ExtractSchemaAsPrimitives<T>>  {
    this.config = compileConfig(this.schema)

    return super.eject()
  }
}
