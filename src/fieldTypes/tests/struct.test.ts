import { NumberType } from '../number'
import { StringType } from '../string'
import { StructType } from '../struct'

describe('StructType', () => {
  it('should validate a valid value', () => {
    const schema = {
      name: new StringType(),
      age: new NumberType().default(18),
    }
    const structType = new StructType(schema)
    structType.eject()

    const value = { name: 'John', age: 30 }
    expect(structType.validate(value)).toEqual(value)
  })

  it('should throw an error for an invalid value', () => {
    const schema = {
      name: new StringType(),
      age: new NumberType().default(18),
    }
    const structType = new StructType(schema)
    structType.eject()

    const value = { name: 123, age: 123 }
    expect(() => structType.validate(value)).toThrow(
      `StructType must be a valid object. Reason: StringType must be a string`,
    )
  })

  it('should subscribe to changes', () => {
    const schema = {
      name: new StringType(),
      age: new NumberType().default(18),
    }
    const structType = new StructType(schema)
    structType.eject()

    const onChangeCallback = jest.fn()
    structType.subscribe(onChangeCallback)

    const value = { name: 'John', age: 30 }
    structType.validate(value)

    expect(onChangeCallback).toHaveBeenCalledWith(value)
  })

  it('should unsubscribe from changes', () => {
    const schema = {
      name: new StringType(),
      age: new NumberType().default(18),
    }
    const structType = new StructType(schema)
    structType.eject()

    const onChangeCallback = jest.fn()
    structType.subscribe(onChangeCallback)
    structType.unsubscribe(onChangeCallback)

    const value = { name: 'John', age: 30 }
    structType.validate(value)

    expect(onChangeCallback).not.toHaveBeenCalled()
  })
})
