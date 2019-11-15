export const ok = <T>(value: T) => OKResult.of(value)
export const error = <E extends Error | PropertyKey>(error: E) => ErrorResult.of(error)

export const OK = 'OK' as const
export const ERROR = 'error' as const

export type Result<T, E extends Error | PropertyKey> = OKResult<T> | ErrorResult<E>
export type ResultState = typeof OK | typeof ERROR

interface BaseResult<S extends ResultState, T, E extends Error | PropertyKey> {
  state: S
  value: T | E
  unwrap(): T | never
  map<O>(transform: (value: T) => O): Result<O, E>
  isOK(): this is OKResult<T>
  isError(): this is ErrorResult<E>
}

class OKResult<T> implements BaseResult<typeof OK, T, never> {
  state: typeof OK = OK
  value: T

  constructor(value: T) {
    this.value = value
  }

  unwrap(): T {
    return this.value
  }

  map<O>(transform: (value: T) => O): OKResult<O> {
    return OKResult.of(transform(this.value))
  }

  isOK(): this is OKResult<T> {
    return true
  }

  isError(): this is ErrorResult<never> {
    return false
  }

  static of<T>(value: T): OKResult<T> {
    return new OKResult(value)
  }
}

class ErrorResult<E extends Error | PropertyKey> implements BaseResult<typeof ERROR, unknown, E> {
  state: typeof ERROR = ERROR
  value: E

  constructor(error: E) {
    this.value = error
  }

  unwrap(): never {
    throw this.value
  }

  map(transform: (value: any) => any): this {
    return this
  }

  isOK(): this is OKResult<never> {
    return false
  }

  isError(): this is ErrorResult<E> {
    return true
  }

  static of<E extends Error | PropertyKey>(error: E): ErrorResult<E> {
    return new ErrorResult(error)
  }
}

const x: Result<string, TypeError> = {} as any

switch (x.state) {
  case OK:
    console.log(x.value)
    break
  case ERROR:
    console.warn(x.value)
}

if (x.isOK()) {
  x.value
} else {
  x.value
}
