import { EventEmitter } from 'stream'
import { BaseType, TypeOptions } from '../fieldTypes'

import { ExtractSchemaAsPrimitives, Schema } from './types'

abstract class BaseSubscribablePromiseHandler<T> {
  /** @internal */
  abstract __getValue(): Promise<T>
  /** @internal */
  abstract __applyValue(value: unknown): void
  /** @internal */
  abstract __isRequired(): boolean

  protected __emitter: EventEmitter

  constructor() {
    this.__emitter = new EventEmitter()
  }

  then(
    this: BaseSubscribablePromiseHandler<T>,
    callback: (
      (value: T) => T | PromiseLike<T>
    ) | null | undefined,
  ): PromiseLike<T> {
    const getValuePromise = this.__getValue()

    if (callback) return getValuePromise.then(callback)

    return getValuePromise
  }

  confListen(onChangeCallback: (newValue: T, oldValue: T) => void): () => void {
    this.__emitter.on('change', onChangeCallback)

    return () => {
      this.confRemoveListener(onChangeCallback)
    }
  }

  confRemoveListener(onChangeCallback: (newValue: T, oldValue: T) => void): void {
    this.__emitter.removeListener('change', onChangeCallback)
  }
}

class ConfigLeafNode<U, T extends BaseType<U>> extends BaseSubscribablePromiseHandler<U> {
  private typeController: T

  private typeOptions: TypeOptions<U>

  private value!: U


  constructor(typeController:  T) {
    super()

    this.typeController = typeController
    this.typeOptions = typeController.eject()
  }

  /** @internal */
  __applyValue(newValue: unknown): void {
    if (this.value === newValue) return

    const oldValue = this.value

    if (newValue === null || newValue === undefined) {
      if (this.typeOptions.isRequired) {
        throw new Error('Config value is required')
      }

      this.value = newValue as unknown as U
    } else {
      this.value = this.typeController.validate(newValue)
    }

    this.__emitter.emit('change', newValue, oldValue)
  }

  /** @internal */
  async __getValue(): Promise<U> {
    return this.value
  }

  /** @internal */
  __isRequired(): boolean {
    return this.typeOptions.isRequired
  }

  // TODO: Look at BaseType's options and check if 'from' func is populated, use if it is
}

class ConfigBranchNode<T extends Schema> extends BaseSubscribablePromiseHandler<ExtractSchemaAsPrimitives<T>> {
  children: {
    [K in keyof T]: T[K] extends Schema ?
      ConfigBranchNode<T[K]>
      : T[K] extends BaseType<infer U> ?
        ConfigLeafNode<U, BaseType<U>>
        : never
  }

  private value!: ExtractSchemaAsPrimitives<T>

  constructor(schema: T) {
    super()

    this.children = {} as any

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const child = schema[key] as T[typeof key]
      if (child instanceof BaseType) {
        this.children[key] = new ConfigLeafNode(child as any) as any
      } else {
        this.children[key] = new ConfigBranchNode(child) as any
      }
      Object.defineProperty(
        this,
        key,
        {
          get: function () { return this.children[key] },
        },
      )
    }
  }

  /** @internal */
  __validateValueHasExpectedStructure(value: unknown): value is Record<keyof T, unknown> {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Expected config object, got ${typeof value}`)
    }

    const keys = Object.keys(this.children) as (keyof T)[]

    for (const key of keys) {
      if (!(key in value) && this.children[key].__isRequired()) {
        throw new Error(`Key ${key} missing in config object ${JSON.stringify(value)}`)
      }
    }

    return true
  }

  /** @internal */
  __applyValue(newValue: unknown): void {
    if (newValue === this.value) return

    if (this.__validateValueHasExpectedStructure(newValue)) {
      for (const key of Object.keys(this.children) as (keyof T)[]) {
        this.children[key].__applyValue(newValue[key])
      }

      const oldValue = this.value
      this.value = newValue as unknown as ExtractSchemaAsPrimitives<T>

      this.__emitter.emit('change', newValue, oldValue)
    }
  }

  /** @internal */
  async __getValue(): Promise<ExtractSchemaAsPrimitives<T>> {
    const result: any = {}

    for (const [key, child] of Object.entries(this.children)) {
      result[key] = await child.__getValue()
    }

    return result as ExtractSchemaAsPrimitives<T>
  }

  /** @internal */
  __isRequired(): boolean {
    return Object.values(this.children).some(child => child.__isRequired())
  }
}

export const compileConfig = <T extends Schema>(schema: T): ConfigBranchNode<T> => {
  return new ConfigBranchNode(schema)
}
