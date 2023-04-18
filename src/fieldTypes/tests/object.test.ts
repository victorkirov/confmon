import { ObjectType } from '../object'

describe('ObjectType', () => {
  describe('validate', () => {
    it('should return an object if the input is an object', () => {
      const objectType = new ObjectType()

      const inputObject = { foo: 'bar' }

      expect(objectType.validate(inputObject)).toEqual(inputObject)
    })

    it('should throw an error if the input is not an object', () => {
      const objectType = new ObjectType()

      expect(() => objectType.validate('abc')).toThrowError('Config value must be an object, got string')
      expect(() => objectType.validate(123)).toThrowError('Config value must be an object, got number')
      expect(() => objectType.validate(true)).toThrowError('Config value must be an object, got boolean')
    })
  })
})
