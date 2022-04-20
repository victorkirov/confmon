import { BaseType } from '../fieldTypes'

import { ExtractSchemaAsPrimitives, Schema } from './types'

abstract class BaseSubscribablePromiseHandler<T> {
  abstract __getValue(): Promise<T>

  then = function (
    this: BaseSubscribablePromiseHandler<T>,
    callback: (
      (value: T) => T | PromiseLike<T>
    ) | null | undefined,
  ): PromiseLike<T> {
    const getValuePromise = this.__getValue()

    if (callback) return getValuePromise.then(callback)

    return getValuePromise
  }

  onChange = () => {
    // TODO: Implement. Look into eventemitter as well
  }
}

class ConfigLeafNode<U, T extends BaseType<U>> extends BaseSubscribablePromiseHandler<U> {
  private typeController!: T

  value!: U

  constructor(typeController:  T) {
    super()

    this.typeController = typeController
  }

  __applyValue = (value: unknown): void => {
    if (this.value === value) return

    this.value = this.typeController.validate(value)

    // TODO: fire onChange event
  }

  __getValue = async (): Promise<U> => {
    return this.value
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

  constructor(schema: T) {
    super()

    this.children = {} as any

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const child = schema[key] as T[typeof key]
      if (child instanceof BaseType) {
        this.children[key] = new ConfigLeafNode(child.eject() as any) as any
        Object.defineProperty(
          this,
          key,
          {
            get: function () { return this.children[key] },
          },
        )
      } else {
        this.children[key] = new ConfigBranchNode(child) as any
        Object.defineProperty(
          this,
          key,
          {
            get: function () { return this.children[key] },
          },
        )
      }
    }
  }

  __applyValue = (value: any): void => {
    for (const key of Object.keys(this.children) as (keyof T)[]) {
      this.children[key].__applyValue(value[key])
    }
  }

  __getValue = async (): Promise<ExtractSchemaAsPrimitives<T>> => {
    const result: any = {}

    for (const [key, child] of Object.entries(this.children)) {
      result[key] = await child.__getValue()
    }

    return result as ExtractSchemaAsPrimitives<T>
  }
}

export const compileConfig = <T extends Schema>(schema: T): ConfigBranchNode<T> => {
  return new ConfigBranchNode(schema)
}
