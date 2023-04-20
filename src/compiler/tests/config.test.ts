import confmon from '../../index'

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
      const type = confmon.asString()
      const node = new ConfigLeafNode(type)
      expect(node).toBeInstanceOf(ConfigLeafNode)
    })

    it('should get the current value synchronously', () => {
      const type = confmon.asString()
      const node = new ConfigLeafNode(type)
      node.__applyValue('hello')
      expect(node.getSync()).toBe('hello')
    })

    it('should get the default value synchronously', () => {
      const type = confmon.asString()
      type.default('helloDefault')
      const node = new ConfigLeafNode(type)
      expect(node.getSync()).toBe('helloDefault')
    })

    it('should apply a new value', () => {
      const type = confmon.asString()
      const node = new ConfigLeafNode(type)
      node.__applyValue('hello')
      node.__applyValue('world')
      expect(node.getSync()).toBe('world')
    })

    it('should apply new value of undefined or null if not  required', () => {
      const type = confmon.asString()

      const node = new ConfigLeafNode(type)

      expect(() => node.__applyValue(null)).not.toThrowError()
      expect(node.getSync()).toBeNull()

      expect(() => node.__applyValue(undefined)).not.toThrowError()
      expect(node.getSync()).toBeUndefined()
    })

    it('should throw if new value is undefined or null and is required', () => {
      const type = confmon.asString()
      type.required()

      const node = new ConfigLeafNode(type)
      expect(() => node.__applyValue(null)).toThrowError('Config value is required')
      expect(() => node.__applyValue(undefined)).toThrowError('Config value is required')
    })

    it('should notify listeners when the value changes', () => {
      const type = confmon.asString()
      const node = new ConfigLeafNode(type)
      const callback = jest.fn()
      node.confListen(callback)
      node.__applyValue('world')
      expect(callback).toHaveBeenCalledWith('world')
    })

    it('should not notify listeners when the value is set to the same', () => {
      const type = confmon.asString()
      const node = new ConfigLeafNode(type)
      const callback = jest.fn()
      node.confListen(callback)
      node.__applyValue('world')
      expect(callback).toHaveBeenCalledWith('world')
      callback.mockReset()
      node.__applyValue('world')
      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove a listener', () => {
      const type = confmon.asString()
      const node = new ConfigLeafNode(type)
      const callback = jest.fn()
      const removeListener = node.confListen(callback)
      removeListener()
      node.__applyValue('world')
      expect(callback).not.toHaveBeenCalled()
    })

    it('should get value from fromFunc if specified', async () => {
      const type = confmon.asString().from(() => '1')

      const node = new ConfigLeafNode(type)

      // This will initially be undefined until the event loop has processed the batch of promises
      expect(node.getSync()).toBe(undefined)
      expect(await node).toBe('1')
      expect(node.getSync()).toBe('1')
    })

    it('should not set value for fromFunc field', async () => {
      const type = confmon.asString().from(() => '1')

      const node = new ConfigLeafNode(type)

      node.__applyValue('2')

      // This will initially be undefined until the event loop has processed the batch of promises
      expect(node.getSync()).toBe(undefined)
      expect(await node).toBe('1')
      expect(node.getSync()).toBe('1')
    })

    it('should poll value from fromFunc', async () => {
      jest.useFakeTimers()

      let counter = 1
      const type = confmon.asNumber().from(() => counter++, { pollInterval: 10 })

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
      const innerType = confmon.asNumber().from(() => counter++, { pollInterval: 10 })

      const type = confmon.asStruct({ inner: innerType })
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
      const innerType = confmon.asNumber().from(() => counter++, { pollInterval: 10 })

      const type = confmon.asStruct({ inner: innerType })
      const outerNode = new ConfigBranchNode({ parent: type })

      const callback = jest.fn()
      outerNode.confListen(callback)

      expect(await outerNode).toEqual({ parent: { inner: 1 } })

      expect(callback).toHaveBeenCalledWith({ parent: { inner: 1 } })

      jest.advanceTimersByTime(15)

      expect(await outerNode).toEqual({ parent: { inner: 2 } })

      expect(callback).toHaveBeenCalledWith({ parent: { inner: 2 } })
    })

    it("should not emit change on parent for subscribable types if value doesn't change", async () => {
      jest.useFakeTimers()

      const innerType = confmon.asNumber().from(() => 1, { pollInterval: 10 })

      const type = confmon.asStruct({ inner: innerType })
      const outerNode = new ConfigBranchNode({ parent: type })

      const callback = jest.fn()
      outerNode.confListen(callback)

      expect(await outerNode).toEqual({ parent: { inner: 1 } })

      expect(callback).toHaveBeenCalledWith({ parent: { inner: 1 } })

      callback.mockReset()
      jest.advanceTimersByTime(15)

      expect(await outerNode).toEqual({ parent: { inner: 1 } })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('ConfigBranchNode', () => {
    it('should get the current value synchronously', () => {
      const type = {
        intro: {
          message: confmon.asString(),
        },
      }
      const node = new ConfigBranchNode(type)
      node.__applyValue({ intro: { message: 'hello world' } })
      expect(node.getSync()).toEqual({ intro: { message: 'hello world' } })
    })

    it('should get the default value synchronously', () => {
      const type = { message: confmon.asString().default('hello world default') }
      const node = new ConfigBranchNode(type)

      expect(node.getSync()).toEqual({ message: 'hello world default' })
    })

    it('should get value form correct key if fromKey is used', () => {
      const type = {
        intro: {
          message: confmon.asString().fromKey('messageSurrogate'),
        },
      }
      const node = new ConfigBranchNode(type)
      node.__applyValue({ intro: { messageSurrogate: 'hello world' } })
      expect(node.getSync()).toEqual({ intro: { message: 'hello world' } })
    })

    it('should throw if not assigned object', () => {
      const type = { message: confmon.asString().default('hello world default') }
      const node = new ConfigBranchNode(type)

      expect(() => node.__applyValue('fail')).toThrowError('Expected config object, got string')
    })

    it('should throw if required leaf is not set', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString().required(),
            field2: confmon.asString().required(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      expect(() =>
        node.__applyValue({
          parent: {
            child: {
              field1: 'hello',
            },
          },
        }),
      ).toThrowError('Key "field2" missing in config object {"field1":"hello"}')
    })

    it('should throw if required leaf is set to undefined', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString().required(),
            field2: confmon.asString().required(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      expect(() =>
        node.__applyValue({
          parent: {
            child: {
              field1: 'hello',
              field2: undefined,
            },
          },
        }),
      ).toThrowError(
        'Error applying value for key "parent": Error applying value for key "child": Error applying value for key "field2": Config value is required',
      )
    })

    it('should throw if required child is not set', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString().required(),
          },
          child2: {
            field1: confmon.asString().required(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      expect(() =>
        node.__applyValue({
          parent: {
            child: {
              field1: 'hello',
            },
          },
        }),
      ).toThrowError(
        'Error applying value for key "parent": Key "child2" missing in config object {"child":{"field1":"hello"}}',
      )
    })

    it('should throw if required child is set to undefined', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString().required(),
          },
          child2: {
            field1: confmon.asString().required(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      expect(() =>
        node.__applyValue({
          parent: {
            child: {
              field1: 'hello',
            },
            child2: undefined,
          },
        }),
      ).toThrowError(
        'Error applying value for key "parent": Error applying value for key "child2": Config value is required',
      )
    })

    it('should apply new value of undefined or null if not  required', () => {
      const type = { hello: confmon.asString() }

      const node = new ConfigBranchNode(type)

      expect(() => node.__applyValue(null)).not.toThrowError()
      expect(node.getSync()).toEqual({ hello: undefined })

      expect(() => node.__applyValue(undefined)).not.toThrowError()
      expect(node.getSync()).toEqual({ hello: undefined })
    })

    it('should notify listeners when the value changes', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      const callback = jest.fn()
      node.confListen(callback)
      node.__applyValue({ parent: { child: { field1: 'hello world' } } })
      expect(callback).toHaveBeenCalledWith({ parent: { child: { field1: 'hello world' } } })
    })

    it('should not notify listeners when the value remains the same', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      const callback = jest.fn()
      node.confListen(callback)

      const newValue = { parent: { child: { field1: 'hello world' } } }
      node.__applyValue(newValue)
      expect(callback).toHaveBeenCalledWith(newValue)

      callback.mockReset()

      node.__applyValue(newValue)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove a listener from calling listen result', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      const callback = jest.fn()

      const removeListener = node.confListen(callback)
      removeListener()

      node.__applyValue({ parent: { child: { field1: 'hello world' } } })
      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove a listener manually', () => {
      const type = {
        parent: {
          child: {
            field1: confmon.asString(),
          },
        },
      }

      const node = new ConfigBranchNode(type)
      const callback = jest.fn()

      node.confListen(callback)
      node.confRemoveListener(callback)

      node.__applyValue({ parent: { child: { field1: 'hello world' } } })
      expect(callback).not.toHaveBeenCalled()
    })
  })
})
