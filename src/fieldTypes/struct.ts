import { ConfigBranchNode, compileConfig } from '../compiler/config'
import { ExtractSchemaAsPrimitives, Schema } from '../compiler/types'

import { BaseType, TypeOptions } from './base'

export class StructType<T extends Schema> extends BaseType<ExtractSchemaAsPrimitives<T>> {
  private schema: T

  private config!: ConfigBranchNode<T>

  private pauseChangeEvents = false

  constructor(schema: T) {
    super()
    this.schema = schema
  }

  validate = (value: unknown): ExtractSchemaAsPrimitives<T> => {
    try {
      this.pauseChangeEvents = true
      this.config.__applyValue(value)
    } catch (error) {
      const err = error as Error
      throw new Error(`StructType must be a valid object. Reason: ${err.message}`)
    } finally {
      this.pauseChangeEvents = false
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
    const onChange = (newValue: ExtractSchemaAsPrimitives<T>): void => {
      if (this.pauseChangeEvents) return

      onChangeCallback(newValue)
    }

    this.config.confListen(onChange)
  }

  /** @internal */
  unsubscribe(onChangeCallback: (newValue: ExtractSchemaAsPrimitives<T>) => void): void {
    this.config.confRemoveListener(onChangeCallback)
  }
}
