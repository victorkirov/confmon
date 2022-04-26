import { EventEmitter } from 'stream'
import { BaseType, TypeOptions } from '../fieldTypes'

import { ExtractSchemaAsPrimitives, Schema } from './types'

abstract class BaseSubscribablePromiseHandler<T> {
  /** @internal */
  abstract __getValue(): Promise<T>
  /** @internal */
  abstract __getOverrideKey(): string | undefined
  /** @internal */
  abstract __applyValue(value: unknown): void
  /** @internal */
  abstract __isRequired(): boolean

  abstract getSync(): T

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

  // TODO: add options and allow firing on startup
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

  private retrievePromise?: Promise<void> | undefined

  private value!: U


  constructor(typeController:  T) {
    super()

    this.typeController = typeController
    this.typeOptions = typeController.eject()

    if (this.typeOptions.fromFunc) {
      // TODO: Improve this and add error handling
      const callFromFunc = () => new Promise(resolve =>{
        resolve(this.typeOptions.fromFunc?.())
      }).then(value => this.__applyValueInternal(value))

      this.retrievePromise = callFromFunc()

      if (this.typeOptions.fromFuncOptions?.pollInterval) {
        setInterval(async () => {
          this.retrievePromise = callFromFunc()
        }, this.typeOptions.fromFuncOptions.pollInterval)
      }
    }
  }

  getSync(): U {
    if (
      (this.value === undefined || this.value === null)
    && this.typeOptions.defaultValue
    ) {
      return this.typeOptions.defaultValue
    }

    return this.value
  }

  /** @internal */
  __applyValue(newValue: unknown): void {
    // Only the fromFunc call will set this value
    if (this.typeOptions.fromFunc) return

    this.__applyValueInternal(newValue)
  }

  __applyValueInternal(newValue: unknown): void {
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
  __getOverrideKey(): string | undefined {
    return this.typeOptions.fromKey
  }

  /** @internal */
  async __getValue(): Promise<U> {
    await this.retrievePromise

    return this.getSync()
  }

  /** @internal */
  __isRequired(): boolean {
    return this.typeOptions.isRequired
  }
}

class ConfigBranchNode<T extends Schema> extends BaseSubscribablePromiseHandler<ExtractSchemaAsPrimitives<T>> {
  __children: {
    [K in keyof T]: T[K] extends Schema ?
      ConfigBranchNode<T[K]>
      : T[K] extends BaseType<infer U> ?
        ConfigLeafNode<U, BaseType<U>>
        : never
  }

  private __value!: ExtractSchemaAsPrimitives<T>

  constructor(schema: T) {
    super()

    this.__children = {} as any

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const child = schema[key] as T[typeof key]
      if (child instanceof BaseType) {
        this.__children[key] = new ConfigLeafNode(child as any) as any
      } else {
        this.__children[key] = new ConfigBranchNode(child) as any
      }
      Object.defineProperty(
        this,
        key,
        {
          get: function () { return this.__children[key] },
        },
      )
    }
  }

  getSync(): ExtractSchemaAsPrimitives<T> {
    const result: any = {}

    for (const [key, child] of Object.entries(this.__children)) {
      result[key] = child.getSync()
    }

    return result as ExtractSchemaAsPrimitives<T>
  }

  /** @internal */
  __validateValueHasExpectedStructure(value: unknown): value is Record<keyof T, unknown> {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Expected config object, got ${typeof value}`)
    }

    const keys = Object.keys(this.__children) as (keyof T)[]

    for (const key of keys) {
      if (!(key in value) && this.__children[key].__isRequired()) {
        throw new Error(`Key ${key} missing in config object ${JSON.stringify(value)}`)
      }
    }

    return true
  }

  /** @internal */
  __applyValue(newValue: unknown): void {
    if (newValue === this.__value) return

    if (this.__validateValueHasExpectedStructure(newValue)) {
      for (const key of Object.keys(this.__children) as (keyof T)[]) {
        const child = this.__children[key]
        const lookupKey = child.__getOverrideKey() ?? key  as keyof T
        child.__applyValue(newValue[lookupKey])
      }

      const oldValue = this.__value
      this.__value = newValue as unknown as ExtractSchemaAsPrimitives<T>

      this.__emitter.emit('change', newValue, oldValue)
    }
  }

  /** @internal */
  __getOverrideKey(): undefined {
    return undefined
  }

  /** @internal */
  async __getValue(): Promise<ExtractSchemaAsPrimitives<T>> {
    const result: any = {}

    for (const [key, child] of Object.entries(this.__children)) {
      result[key] = await child.__getValue()
    }

    return result as ExtractSchemaAsPrimitives<T>
  }

  /** @internal */
  __isRequired(): boolean {
    return Object.values(this.__children).some(child => child.__isRequired())
  }
}

export const compileConfig = <T extends Schema>(schema: T): ConfigBranchNode<T> => {
  return new ConfigBranchNode(schema)
}
