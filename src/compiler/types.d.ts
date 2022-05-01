import {
  AllTypes,
  BaseType,
} from '../fieldTypes'

type ReservedKeys = 'then' | 'confListen' | 'confRemoveListener' | 'getSync'

export type NonReserved<T> = T extends Primitive ? T : {
  [K in keyof T]: K extends ReservedKeys ? never : NonReserved<T[K]>
}

export type Schema = Record<string, AllTypes | ChildSchema>
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

export interface ListenOptions {
  /**
   * If true, the listener will be called immediately with the current value of the config.
   */
  callOnInit?: boolean
}

type ExpandSubscribableType<T> = T extends Primitive ? T
  : T extends Array<infer U> ?
    U[]
    : ExtractSchemaAsPrimitives<T>

type Subscribable<T> = PromiseLike<ExpandSubscribableType<T>> & {
  confListen: (
    callback: (
      newValue: ExpandSubscribableType<T>,
      oldValue: ExpandSubscribableType<T>
    ) => void,
    options?: ListenOptions
  ) => UnsubscribeFunction
  confRemoveListener: (
    callback: (
      newValue: ExpandSubscribableType<T>,
      oldValue: ExpandSubscribableType<T>
    ) => void
  ) => void
  getSync: () => ExpandSubscribableType<T>
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
