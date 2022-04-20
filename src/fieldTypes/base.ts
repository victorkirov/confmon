type FromFuncOptions = {
  pollInterval?: number
}

export type TypeOptions<T> = {
  isRequired: boolean
  defaultValue?: T
  fromFunc?: () => Promise<T> // TODO: Add config as arg
  fromFuncOptions?: FromFuncOptions | undefined
}

export abstract class BaseType<T> {
  protected options: TypeOptions<T> = {
    isRequired: false,
  }

  protected isEjected = false

  protected ejectedGate = () => {
    if (this.isEjected) {
      throw new Error('Cannot modify field after config compilation')
    }
  }

  required = <BT extends this & { default: never; nullable: false }>(): BT => {
    this.ejectedGate()

    if (this.options.defaultValue) {
      throw new Error('Cannot set required on a field with a default value')
    }

    this.options.isRequired = true
    return this as BT
  }

  default = <BT extends this & { required: never; nullable: false }>(value: T): BT => {
    this.ejectedGate()

    if (this.options.isRequired) {
      throw new Error('Cannot set default value for required field')
    }

    this.options.defaultValue = value

    return this as BT
  }

  from = (fromFunc: () => Promise<T>, options?: FromFuncOptions): this => {
    this.ejectedGate()

    this.options.fromFunc = fromFunc
    this.options.fromFuncOptions = options

    return this
  }

  /** @internal */
  eject = (): TypeOptions<T>  => {
    this.isEjected = true
    return this.options
  }

  /** @internal */
  abstract validate: (_value: unknown) => T
}