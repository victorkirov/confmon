import { NumberType } from '../number'

describe('NumberType', () => {
  describe('validate', () => {
    it('should return a number if the input is a valid number string', () => {
      const numberType = new NumberType()

      expect(numberType.validate('123')).toEqual(123)
      expect(numberType.validate('-456.789')).toEqual(-456.789)
    })

    it('should throw an error if the input is not a valid number string', () => {
      const numberType = new NumberType()

      expect(() => numberType.validate('abc')).toThrowError('NumberType must be a valid number')
      expect(() => numberType.validate('123abc')).toThrowError('NumberType must be a valid number')
    })
  })
})
