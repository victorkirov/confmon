import  { compile }  from './compiler'

import {
  BaseType,
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
  asString: () => new StringType(),
  asNumber: () => new NumberType(),
  asPort: () => new PortType(),
  asObject: () => new ObjectType(),
}
