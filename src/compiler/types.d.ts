import {
  BaseType,
  PortType,
  StringType,
} from '../fieldTypes'

export type Schema = Record<string, PortType | StringType | ChildSchema>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ChildSchema extends Schema {}

type Primitive = string | number | boolean | bigint | symbol | null | undefined
type Expand<T> = T extends Primitive ? T : { [K in keyof T]: T[K] }

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { nullable: false } | Schema ?
    K : never
}[keyof T]

type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { nullable: false } ? never : K;
}[keyof T]

export type ExtractSchemaAsPrimitives<T extends Schema> = Expand<{
  [K in RequiredKeys<T>]-?: K extends keyof T ?
    T[K] extends BaseType<infer U> ?
      U
      : T[K] extends Schema ?
        ExtractSchemaAsPrimitives<T[K]>
        : never
    : never
} & {
  [K in OptionalKeys<T>]?: K extends keyof T ?
    T[K] extends BaseType<infer U> ?
      U | null | undefined
      : T[K] extends Schema ?
        ExtractSchemaAsPrimitives<T[K]>
        : never
    : never
}>

type UnsubscribeFunction = () => void

type Subscribable<T> = PromiseLike<T extends Primitive ? T : ExtractSchemaAsPrimitives<T>> & {
  confListen: (callback: (value: T extends Primitive ? T : ExtractSchemaAsPrimitives<T>) => void) => UnsubscribeFunction
  confRemoveListener: (callback: (value: T extends Primitive ? T : ExtractSchemaAsPrimitives<T>) => void) => void
}

export type ConvertToSubscribableSchema<T extends Schema> = Expand<{
  [K in RequiredKeys<T>]-?: K extends keyof T ?
    T[K] extends BaseType<infer U> ?
      Subscribable<U>
      : T[K] extends Schema ?
        ConvertToSubscribableSchema<T[K]> & Subscribable<T[K]>
        : never
    : never
} & {
  [K in OptionalKeys<T>]-?: K extends keyof T ?
    T[K] extends BaseType<infer U> ?
      Subscribable<U>
      : T[K] extends Schema ?
        ConvertToSubscribableSchema<T[K]> & Subscribable<T[K]>
        : never
    : never
}>
