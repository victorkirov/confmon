import { BaseType } from '../fieldTypes'

import { ExtractSchemaAsPrimitives, Schema } from './types'

class ConfigLeafNode<U, T extends BaseType<U>> {
  private typeController!: T

  value!: U

  constructor(typeController:  T) {
    this.typeController = typeController
  }

  validateValue = (value: unknown): value is U => {
    this.typeController.validate(value)
    return true
  }

  updateValue = (value: unknown): void => {
    if (this.value === value) return

    if (this.validateValue(value)) {
      this.value = value
    }

    // TODO: fire onChange event
  }

  getValue = async (): Promise<U> => {
    return this.value
  }

  then = function (
    this: ConfigLeafNode<U, T>,
    callback: (
      (value: U) => U | PromiseLike<U>
    ) | null | undefined,
  ): PromiseLike<U> {
    const getValuePromise = this.getValue()

    if (callback) return getValuePromise.then(callback)

    return getValuePromise
  }

  onChange = () => {
    // TODO
  }

  // TODO: Look at BaseType's options and check if 'from' func is populated, use if it is
}

class ConfigBranchNode<T extends Schema> {
  // children!: {
  //   [K in keyof T]: T[K] extends Schema ?
  //     ConfigBranchNode<T[K]>
  //     : T[K] extends BaseType<infer U> ?
  //       ConfigLeafNode<U, T[K]>
  //       : never
  // }

  schemaChildren: {
    [K in keyof T]: T[K] extends Schema ? ConfigBranchNode<T[K]> : never
  }

  primitiveChildren: {
    [K in keyof T]: T[K] extends BaseType<infer U> ? ConfigLeafNode<U, BaseType<U>> : never
  }


  constructor(schema: T) {
    this.schemaChildren = {} as any
    this.primitiveChildren = {} as any

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const child = schema[key] as T[typeof key]
      if (child instanceof BaseType) {
        this.primitiveChildren[key] = new ConfigLeafNode(child.eject() as any) as any
        (this as any)[key] = this.primitiveChildren[key]
      } else {
        this.schemaChildren[key] = new ConfigBranchNode(child) as any
        (this as any)[key] = this.schemaChildren[key]
      }
    }
  }

  applyValue = (value: any): void => {
    for (const key of Object.keys(this.primitiveChildren) as (keyof T)[]) {
      this.primitiveChildren[key].updateValue(value[key])
    }

    for (const key of Object.keys(this.schemaChildren) as (keyof T)[]) {
      this.schemaChildren[key].applyValue(value[key])
    }
  }

  getValue = async (): Promise<ExtractSchemaAsPrimitives<T>> => {
    const result: any = {}

    for (const [key, child] of Object.entries(this.schemaChildren)) {
      result[key] = await child.getValue()
    }

    for (const [key, child] of Object.entries(this.primitiveChildren)) {
      result[key] = await child.getValue()
    }

    return result as ExtractSchemaAsPrimitives<T>
  }

  then = function (
    this: ConfigBranchNode<T>,
    callback: (
      (value: ExtractSchemaAsPrimitives<T>) => ExtractSchemaAsPrimitives<T> | PromiseLike<ExtractSchemaAsPrimitives<T>>
    ) | null | undefined,
  ): PromiseLike<ExtractSchemaAsPrimitives<T>> {
    const getValuePromise = this.getValue()

    if (callback) return getValuePromise.then(callback)

    return getValuePromise
  }

  onChange = () => {
    // TODO
  }
}

export const compileConfig = <T extends Schema>(schema: T): ConfigBranchNode<T> => {
  return new ConfigBranchNode(schema)
}
