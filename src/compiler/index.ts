import {
  BaseType,
  PortType,
  StringType,
} from '../fieldTypes'

type Schema = Record<string, PortType | StringType | ChildSchema>
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

type ConvertSchema<T extends Schema> = Expand<{
  [K in RequiredKeys<T>]-?: K extends keyof T ?
    T[K] extends BaseType<infer U> ?
      U
      : T[K] extends Schema ?
        ConvertSchema<T[K]>
        : never
    : never
} & {
  [K in OptionalKeys<T>]?: K extends keyof T ?
    T[K] extends BaseType<infer U> ?
      U
      : T[K] extends Schema ?
        ConvertSchema<T[K]>
        : never
    : never
}>

class ObjectType extends BaseType<object> {
  children: { [key: string]: ObjectType | StringType | PortType } = {}

  protected schema!: Schema

  constructor(schema: Schema) {
    super()
    this.schema = schema
  }

  compile = (): this => {
    super.compile()

    for (const [key, child] of Object.entries(this.schema)) {
      if (child instanceof BaseType) {
        this.children[key] = child.compile()
      } else {
        this.children[key] = new ObjectType(child).compile()
      }
    }

    return this
  }
}

const compileSchema = (schema: Schema): ObjectType => {
  return new ObjectType(schema).compile()
}

const compile = <T extends Schema>(schema: T): ConvertSchema<T> => {
  const compiledSchema = compileSchema(schema)

  // TODO: read (initialise) config here and setup directory/file watchers
  // TODO: Implement converted schema from compiled

  return compiledSchema as unknown as ConvertSchema<T>
}

export default {
  asString: () => new StringType(),
  asPort: () => new PortType(),
  compile,
}
