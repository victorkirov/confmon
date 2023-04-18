import { BaseType } from '../base'
import { ListType } from '../list'

class TestType extends BaseType<string> {
  validate = (value: string): string => {
    if (typeof value !== 'string') {
      throw new Error('Not a string')
    }
    return value
  }
}

describe('ListType', () => {
  describe('validate', () => {
    it('should throw an error if the value is not an array', () => {
      const listType = new ListType(new TestType())

      expect(() => listType.validate(123)).toThrowError('ListType must be an array')
    })

    it('should throw an error if the value is an array but not of the expected type', () => {
      const listType = new ListType(new TestType())

      expect(() => listType.validate([1])).toThrowError('ListType must be a valid array. Reason: Not a string')
    })

    it('should throw an error if the value is a multi-value array but one of the items is not of the expected type', () => {
      const listType = new ListType(new TestType())

      expect(() => listType.validate(['123', '32', 1])).toThrowError(
        'ListType must be a valid array. Reason: Not a string',
      )
    })

    it('should return the value if it is valid', () => {
      const listType = new ListType(new TestType())

      const value = listType.validate(['foo', 'bar'])

      expect(value).toEqual(['foo', 'bar'])
    })
  })

  describe('eject', () => {
    it('should eject the element type as well as self', () => {
      const elementType = new TestType()
      const listType = new ListType(elementType)
      listType.eject()

      expect(listType['isEjected']).toEqual(true)
      expect(elementType['isEjected']).toEqual(true)
    })
  })
})
