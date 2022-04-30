import  { compile }  from './compiler'

import {
  BaseType,
  EnumType,
  NumberType,
  ObjectType,
  PortType,
  StringType,
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
  asObject: () => new ObjectType(),
}
