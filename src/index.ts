import  { compile }  from './compiler'

import {
  NumberType,
  ObjectType,
  PortType,
  StringType,
} from './fieldTypes'

export default {
  compile,
  asString: () => new StringType(),
  asNumber: () => new NumberType(),
  asPort: () => new PortType(),
  asObject: () => new ObjectType(),
}
