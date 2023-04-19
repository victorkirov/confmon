import { NumberType } from '../../fieldTypes/number'
import { StringType } from '../../fieldTypes/string'
import { StructType } from '../../fieldTypes/struct'

import { BaseSubscribablePromiseHandler, ConfigBranchNode, ConfigLeafNode } from '../config'

describe('configHandlers', () => {
  describe('BaseSubscribablePromiseHandler', () => {
    let handler: BaseSubscribablePromiseHandler<string>

    beforeEach(() => {
      handler = new (class extends BaseSubscribablePromiseHandler<string> {
        __getValue() {
          return Promise.resolve('value')
        }

        __getOverrideKey() {
          return undefined
        }

        __applyValue(_value: unknown) {
          // do nothing
        }

        __isRequired() {
          return true
        }

        __notifyChange() {
          this.__emitter.emit('change', this.getSync())
        }

        getSync() {
          return 'value'
        }
      })()
    })

    it('returns a promise that resolves to the value returned by __getValue', async () => {
      const value = await handler.then()
      expect(value).toEqual('value')
    })

    it('applies the callback to the value returned by __getValue', async () => {
      const callback = jest.fn(value => `${value}123`)
      const value = await handler.then(callback)
      expect(callback).toHaveBeenCalledWith('value')
      expect(value).toEqual('value123')
    })

    it('registers an onChangeCallback with the __emitter', () => {
      const onChangeCallback = jest.fn()
      handler.confListen(onChangeCallback)
      expect(handler['__emitter'].listenerCount('change')).toEqual(1)
    })

    it('calls onChangeCallback with the current value if options.callOnInit is true', () => {
      const onChangeCallback = jest.fn()
      handler.confListen(onChangeCallback, { callOnInit: true })
      expect(onChangeCallback).toHaveBeenCalledWith('value')
    })

    it('removes an onChangeCallback from the __emitter', () => {
      const onChangeCallback = jest.fn()
      handler.confListen(onChangeCallback)
      expect(handler['__emitter'].listenerCount('change')).toEqual(1)
      handler.confRemoveListener(onChangeCallback)
      expect(handler['__emitter'].listenerCount('change')).toEqual(0)
    })
  })

  describe('ConfigLeafNode', () => {
    it('should create a ConfigLeafNode instance', () => {
      const type = new StringType()
      const node = new ConfigLeafNode(type)
      expect(node).toBeInstanceOf(ConfigLeafNode)
    })

    it('should get the current value synchronously', () => {
      const type = new StringType()
      const node = new ConfigLeafNode(type)
      node.__applyValue('hello')
      expect(node.getSync()).toBe('hello')
    })

    it('should get the default value synchronously', () => {
      const type = new StringType()
      type.default('helloDefault')
      const node = new ConfigLeafNode(type)
      expect(node.getSync()).toBe('helloDefault')
    })

    it('should apply a new value', () => {
      const type = new StringType()
      const node = new ConfigLeafNode(type)
      node.__applyValue('hello')
      node.__applyValue('world')
      expect(node.getSync()).toBe('world')
    })

    it('should apply new value of undefined or null if not  required', () => {
      const type = new StringType()

      const node = new ConfigLeafNode(type)

      expect(() => node.__applyValue(null)).not.toThrowError()
      expect(node.getSync()).toBeNull()

      expect(() => node.__applyValue(undefined)).not.toThrowError()
      expect(node.getSync()).toBeUndefined()
    })

    it('should throw if new value is undefined or null and is required', () => {
      const type = new StringType()
      type.required()

      const node = new ConfigLeafNode(type)
      expect(() => node.__applyValue(null)).toThrowError('Config value is required')
      expect(() => node.__applyValue(undefined)).toThrowError('Config value is required')
    })

    it('should notify listeners when the value changes', () => {
      const type = new StringType()
      const node = new ConfigLeafNode(type)
      const callback = jest.fn()
      node.confListen(callback)
      node.__applyValue('world')
      expect(callback).toHaveBeenCalledWith('world')
    })

    it('should remove a listener', () => {
      const type = new StringType()
      const node = new ConfigLeafNode(type)
      const callback = jest.fn()
      const removeListener = node.confListen(callback)
      removeListener()
      node.__applyValue('world')
      expect(callback).not.toHaveBeenCalled()
    })

    it('should get value from fromFunc if specified', async () => {
      const type = new StringType()
      type.from(() => '1')

      const node = new ConfigLeafNode(type)

      // This will initially be undefined until the event loop has processed the batch of promises
      expect(node.getSync()).toBe(undefined)
      expect(await node).toBe('1')
      expect(node.getSync()).toBe('1')
    })

    it('should poll value from fromFunc', async () => {
      jest.useFakeTimers()

      let counter = 1
      const type = new NumberType()
      type.from(() => counter++, { pollInterval: 10 })

      const node = new ConfigLeafNode(type)

      // This will initially be undefined until the event loop has processed the batch of promises
      expect(node.getSync()).toBe(undefined)
      expect(await node).toBe(1)
      expect(node.getSync()).toBe(1)

      jest.advanceTimersByTime(5)

      expect(await node).toBe(1)
      expect(node.getSync()).toBe(1)

      jest.advanceTimersByTime(5)

      expect(node.getSync()).toBe(1)
      expect(await node).toBe(2)
      expect(node.getSync()).toBe(2)

      jest.advanceTimersByTime(10)

      expect(node.getSync()).toBe(2)
      expect(await node).toBe(3)
      expect(node.getSync()).toBe(3)
    })

    it('should emit change on subscribable types', async () => {
      jest.useFakeTimers()

      let counter = 1
      const innerType = new NumberType()
      innerType.from(() => counter++, { pollInterval: 10 })

      const type = new StructType({ inner: innerType })
      const node = new ConfigLeafNode(type)

      const callback = jest.fn()
      node.confListen(callback)

      expect(await node).toEqual({ inner: 1 })

      expect(callback).toHaveBeenCalledWith({ inner: 1 })

      jest.advanceTimersByTime(15)

      expect(await node).toEqual({ inner: 2 })

      expect(callback).toHaveBeenCalledWith({ inner: 2 })
    })

    it('should emit change on parent for subscribable types', async () => {
      jest.useFakeTimers()

      let counter = 1
      const innerType = new NumberType()
      innerType.from(() => counter++, { pollInterval: 10 })

      const type = new StructType({ inner: innerType })
      const outerNode = new ConfigBranchNode({ parent: type })

      const callback = jest.fn()
      outerNode.confListen(callback)

      expect(await outerNode).toEqual({ parent: { inner: 1 } })

      expect(callback).toHaveBeenCalledWith({ parent: { inner: 1 } })

      jest.advanceTimersByTime(15)

      expect(await outerNode).toEqual({ parent: { inner: 2 } })

      expect(callback).toHaveBeenCalledWith({ parent: { inner: 2 } })
    })
  })
})
