import { BaseType } from '../base'

class MyType extends BaseType<string> {
  validate(value: string): string {
    return value
  }
}

describe('BaseType', () => {
  describe('required', () => {
    it('should set isRequired to true', () => {
      const myType = new MyType()
      myType.required()

      expect(myType['options'].isRequired).toEqual(true)
    })

    it('should throw an error if a default value is set', () => {
      const myType = new MyType()
      myType.default('default value')

      expect(() => myType.required()).toThrowError('Cannot set required on a field with a default value')
    })

    it('should throw an error if ejected', () => {
      const myType = new MyType()
      myType.eject()

      expect(() => myType.required()).toThrowError('Cannot modify field after config compilation')
    })
  })

  describe('default', () => {
    it('should set defaultValue to the given value', () => {
      const myType = new MyType()
      myType.default('default value')

      expect(myType['options'].defaultValue).toEqual('default value')
    })

    it('should throw an error if isRequired is true', () => {
      const myType = new MyType()
      myType.required()

      expect(() => myType.default('default value')).toThrowError('Cannot set default value for required field')
    })

    it('should throw an error if ejected', () => {
      const myType = new MyType()
      myType.eject()

      expect(() => myType.default('default value')).toThrowError('Cannot modify field after config compilation')
    })
  })

  describe('from', () => {
    it('should set fromFunc and fromFuncOptions', () => {
      const myType = new MyType()
      myType.from(() => 'value', { pollInterval: 100 })

      expect(myType['options'].fromFunc).toBeInstanceOf(Function)
      expect(myType['options'].fromFuncOptions).toEqual({ pollInterval: 100 })
    })
  })

  describe('fromKey', () => {
    it('should set fromKey', () => {
      const myType = new MyType()
      myType.fromKey('key')

      expect(myType['options'].fromKey).toEqual('key')
    })

    it('should throw an error if ejected', () => {
      const myType = new MyType()
      myType.eject()

      expect(() => myType.fromKey('key')).toThrowError('Cannot modify field after config compilation')
    })
  })

  describe('eject', () => {
    it('should return a copy of options', () => {
      const myType = new MyType()
      myType.default('default value')
      myType.from(() => 'value', { pollInterval: 100 })

      const options = myType.eject()

      expect(options).toEqual({
        isRequired: false,
        defaultValue: 'default value',
        fromFunc: expect.any(Function),
        fromFuncOptions: { pollInterval: 100 },
        fromKey: undefined,
      })
      expect(options.fromFunc!()).toEqual('value')
    })

    it('should set isEjected to true', () => {
      const myType = new MyType()
      myType.eject()

      expect(myType['isEjected']).toEqual(true)
    })

    it('should allow eject to be called multiple times', () => {
      const myType = new MyType()
      myType.eject()

      expect(() => myType.eject()).not.toThrowError()
    })

    it('should not allow modification of options', () => {
      const myType = new MyType()
      myType.default('default value')
      const mutableOptions = myType.eject()

      mutableOptions.defaultValue = 'new default value'

      const options = myType.eject()

      expect(options).toEqual({
        isRequired: false,
        defaultValue: 'default value',
      })
    })
  })
})
