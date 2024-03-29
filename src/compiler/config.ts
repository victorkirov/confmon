import { EventEmitter } from 'stream'
import { BaseType, TypeOptions } from '../fieldTypes'

import { ExtractSchemaAsPrimitives, ListenOptions, Schema } from './types'

export abstract class BaseSubscribablePromiseHandler<T> {
  /** @internal */
  abstract __getValue(): Promise<T>
  /** @internal */
  abstract __getOverrideKey(): string | undefined
  /** @internal */
  abstract __applyValue(value: unknown): void
  /** @internal */
  abstract __isRequired(): boolean
  /** @internal */
  abstract __notifyChange(): void

  abstract getSync(): T

  protected __emitter: EventEmitter

  constructor() {
    this.__emitter = new EventEmitter()
  }

  then(
    this: BaseSubscribablePromiseHandler<T>,
    callback?: ((value: T) => T | PromiseLike<T>) | null | undefined,
  ): PromiseLike<T> {
    const getValuePromise = this.__getValue()

    if (callback) return getValuePromise.then(callback)

    return getValuePromise
  }

  confListen(onChangeCallback: (newValue: T) => void, options?: ListenOptions): () => void {
    this.__emitter.on('change', onChangeCallback)

    if (options?.callOnInit) {
      onChangeCallback(this.getSync())
    }

    return () => {
      this.confRemoveListener(onChangeCallback)
    }
  }

  confRemoveListener(onChangeCallback: (newValue: T) => void): void {
    this.__emitter.removeListener('change', onChangeCallback)
  }
}

export class ConfigLeafNode<U, T extends BaseType<U>> extends BaseSubscribablePromiseHandler<U> {
  private typeController: T

  private typeOptions: TypeOptions<U>

  private retrievePromise?: Promise<void> | undefined

  private value!: U

  private lastAppliedValue?: unknown

  private parent: ConfigBranchNode<any> | undefined

  constructor(typeController: T, parent?: ConfigBranchNode<any>) {
    super()

    this.parent = parent
    this.typeController = typeController
    this.typeOptions = typeController.eject()

    if (this.typeOptions.fromFunc) {
      // TODO: Improve this and add error handling
      const callFromFunc = () =>
        new Promise(resolve => {
          resolve(this.typeOptions.fromFunc!())
        }).then(value => this.__applyValueInternal(value, true))

      this.retrievePromise = callFromFunc()

      if (this.typeOptions.fromFuncOptions?.pollInterval) {
        setInterval(async () => {
          if (this.retrievePromise) await this.retrievePromise
          this.retrievePromise = callFromFunc()
        }, this.typeOptions.fromFuncOptions.pollInterval)
      }
    }

    this.typeController.subscribe(newValue => {
      if (this.value === newValue) return

      this.value = newValue

      this.__notifyChange()
      this.parent?.__notifyChange()
    })
  }

  getSync(): U {
    if ((this.value === undefined || this.value === null) && this.typeOptions.defaultValue) {
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

  /** @internal */
  __applyValueInternal(newValue: unknown, fromFromFunc = false): void {
    if ((newValue === null || newValue === undefined) && this.__isRequired()) {
      throw new Error('Config value is required')
    }

    if (this.lastAppliedValue === newValue) return

    if (newValue === null || newValue === undefined) {
      this.value = newValue as unknown as U
    } else {
      this.value = this.typeController.validate(newValue)
    }

    this.lastAppliedValue = newValue

    this.__notifyChange()

    if (fromFromFunc && this.parent) {
      // We only notify parent of a change if the change came form a fromFunc
      // Any change other than that would come form the parent itself and the parent would notify of changes itself
      this.parent.__notifyChange()
    }
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

  /** @internal */
  __notifyChange(): void {
    this.__emitter.emit('change', this.value)
  }
}

export class ConfigBranchNode<T extends Schema> extends BaseSubscribablePromiseHandler<ExtractSchemaAsPrimitives<T>> {
  __children: {
    [K in keyof T]: T[K] extends Schema
      ? ConfigBranchNode<T[K]>
      : T[K] extends BaseType<infer U>
      ? ConfigLeafNode<U, BaseType<U>>
      : never
  }

  private __lastAppliedValue?: unknown

  private __parent: ConfigBranchNode<any> | undefined

  constructor(schema: T, parent?: ConfigBranchNode<any>) {
    super()

    this.__parent = parent
    this.__children = {} as any

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const child = schema[key] as T[typeof key]
      if (child instanceof BaseType) {
        this.__children[key] = new ConfigLeafNode(child as any, this) as any
      } else {
        this.__children[key] = new ConfigBranchNode(child, this) as any
      }
      Object.defineProperty(this, key, {
        get: function () {
          return this.__children[key]
        },
      })
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
        throw new Error(`Key "${String(key)}" missing in config object ${JSON.stringify(value)}`)
      }
    }

    return true
  }

  /** @internal */
  __applyValue(newValue: unknown): void {
    if (this.__isRequired() && (newValue === null || newValue === undefined)) {
      throw new Error('Config value is required')
    }

    if (newValue === this.__lastAppliedValue) return

    if (newValue === null || newValue === undefined || this.__validateValueHasExpectedStructure(newValue)) {
      const notifyValue: Partial<Record<keyof T, unknown>> = {}

      for (const key of Object.keys(this.__children) as (keyof T)[]) {
        const child = this.__children[key]
        const lookupKey = child.__getOverrideKey() ?? (key as keyof T)

        try {
          child.__applyValue(newValue?.[lookupKey])
        } catch (error) {
          const err = error as Error
          throw new Error(`Error applying value for key "${String(key)}": ${err.message}`)
        }

        notifyValue[key] = child.getSync()
      }

      this.__lastAppliedValue = newValue as unknown as ExtractSchemaAsPrimitives<T>

      this.__emitter.emit('change', notifyValue)
    }
  }

  /** @internal */
  __notifyChange(): void {
    const notifyValue: Partial<Record<keyof T, unknown>> = {}

    for (const key of Object.keys(this.__children) as (keyof T)[]) {
      const child = this.__children[key]
      notifyValue[key] = child.getSync()
    }

    this.__emitter.emit('change', notifyValue)

    if (this.__parent) this.__parent.__notifyChange()
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
