import { EnumType } from '../enum'

describe('EnumType', () => {
  describe('validate', () => {
    it('should throw an error if the value is not a string', () => {
      const enumType = new EnumType(['foo', 'bar'])

      expect(() => enumType.validate(123)).toThrowError('EnumType must be a string')
    })

    it('should throw an error if the value is not one of the allowed values', () => {
      const enumType = new EnumType(['foo', 'bar'])

      expect(() => enumType.validate('baz')).toThrowError('EnumType must be one of foo, bar')
    })

    it('should return the value if it is one of the allowed values', () => {
      const enumType = new EnumType(['foo', 'bar'])

      const value = enumType.validate('foo')

      expect(value).toEqual('foo')
    })
  })
})
