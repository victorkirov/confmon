import { PortType } from '../port'

describe('PortType', () => {
  describe('validate', () => {
    it('should return a valid port number', () => {
      const portType = new PortType()

      const validPortNumber = 8080

      expect(portType.validate(validPortNumber)).toEqual(validPortNumber)
    })

    it('should throw an error if the input is not a number', () => {
      const portType = new PortType()

      expect(() => portType.validate('abc')).toThrowError('PortType must be a valid number')
    })

    it('should throw an error if the input is less than 0', () => {
      const portType = new PortType()

      const invalidPortNumber = -1

      expect(() => portType.validate(invalidPortNumber)).toThrowError('PortType must be between 0 and 65535')
    })

    it('should throw an error if the input is greater than 65535', () => {
      const portType = new PortType()

      const invalidPortNumber = 65536

      expect(() => portType.validate(invalidPortNumber)).toThrowError('PortType must be between 0 and 65535')
    })
  })
})
