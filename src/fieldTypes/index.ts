export { BaseType, TypeOptions } from './base'
import { NumberType } from './number'
import { ObjectType } from './object'
import { PortType } from './port'
import { StringType } from './string'

export type AllTypes = NumberType | PortType | StringType | ObjectType

export {
  NumberType,
  ObjectType,
  PortType,
  StringType,
}
