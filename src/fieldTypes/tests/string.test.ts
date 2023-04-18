import { StringType } from '../string'

describe('StringType', () => {
  describe('validate', () => {
    it('should return the input string if given a string', () => {
      const stringType = new StringType()
      const input = 'hello'
      expect(stringType.validate(input)).toEqual(input)
    })

    it('should throw an error if given a non-string value', () => {
      const stringType = new StringType()
      const input = 123
      expect(() => stringType.validate(input)).toThrowError('StringType must be a string')
    })
  })
})
