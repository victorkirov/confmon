import  { compile }  from './compiler'
import  { Schema }  from './compiler/types'

import {
  BaseType,
  EnumType,
  ListType,
  NumberType,
  ObjectType,
  PortType,
  StringType,
  StructType,
} from './fieldTypes'

export {
  BaseType,
}

export default {
  compile,
  asEnum: (values: string[]) => new EnumType(values),
  asString: () => new StringType(),
  asNumber: () => new NumberType(),
  asPort: () => new PortType(),
  asUnstructuredObject: () => new ObjectType(),
  asStruct: <T extends Schema>(schema: T) => new StructType(schema),
  asList: <T extends BaseType<unknown>>(itemType: T) => new ListType(itemType),
}
