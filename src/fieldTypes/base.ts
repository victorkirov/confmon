type FromFuncOptions = {
  /** ms */
  pollInterval?: number
}

export type TypeOptions<T> = {
  isRequired: boolean
  defaultValue?: T
  fromFunc?: () => Promise<T> | T
  fromFuncOptions?: FromFuncOptions | undefined
  fromKey?: string
}

export abstract class BaseType<T> {
  protected options: TypeOptions<T> = {
    isRequired: false,
  }

  protected isEjected = false

  protected ejectedGate() {
    if (this.isEjected) {
      throw new Error('Cannot modify field after config compilation')
    }
  }

  required<BT extends this & { from: never; default: never; nullable: false }>(): BT {
    this.ejectedGate()

    if (this.options.defaultValue) {
      throw new Error('Cannot set required on a field with a default value')
    }

    this.options.isRequired = true
    return this as unknown as BT
  }

  default<BT extends this & { required: never; nullable: false }>(value: T): BT {
    this.ejectedGate()

    if (this.options.isRequired) {
      throw new Error('Cannot set default value for required field')
    }

    this.options.defaultValue = value

    return this as unknown as BT
  }

  from<BT extends this & { required: never; fromKey: never }>(
    fromFunc: () => Promise<T> | T,
    options?: FromFuncOptions,
  ): BT {
    this.ejectedGate()

    this.options.fromFunc = fromFunc
    this.options.fromFuncOptions = options

    return this as unknown as BT
  }

  fromKey<BT extends this & { from: never }>(key: string): BT {
    this.ejectedGate()

    this.options.fromKey = key

    return this as unknown as BT
  }

  /** @internal */
  eject(): TypeOptions<T> {
    this.isEjected = true
    return { ...this.options }
  }

  /** @internal */
  subscribe(_onChangeCallback: (newValue: T) => void): void {}

  /** @internal */
  unsubscribe(_onChangeCallback: (newValue: T) => void): void {}

  /** @internal */
  abstract validate(_value: unknown): T
}
