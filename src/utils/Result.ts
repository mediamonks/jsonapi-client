import { literal } from 'isntnt'

type ResultResolver<T, E> = (accept: (value: T) => void, reject: (value: E) => void) => void

type Nothing = typeof nothing

const nothing = Symbol('Nothing')
const isNothing = literal(nothing)

export class Result<T, E> {
  value: T | E = nothing as any
  state: 'accepted' | 'rejected' = 'rejected'
  constructor(resolver: ResultResolver<T, E>) {
    resolver(
      (value: T) => {
        this.value = value
        this.state = 'accepted'
      },
      (value: E) => {
        this.value = value
      },
    )
    if (isNothing(this.value)) {
      throw new Error(`Result must be resolved`)
    }
  }

  isSuccess(): this is Result<T, never> {
    return this.state === 'accepted'
  }

  isRejected(): this is Result<never, E> {
    return this.state === 'rejected'
  }

  map<O>(transform: (value: T) => O): Result<O, E> {
    if (this.isSuccess()) {
      return Result.accept(transform(this.value))
    }
    return this as any
  }

  flatMap<O>(transform: (value: T) => Result<O, E>): Result<O, E> {
    if (this.isSuccess()) {
      return transform(this.value)
    }
    return this as any
  }

  unwrap(): T {
    if (!this.isSuccess()) {
      throw this.value
    }
    return this.value
  }

  static accept<T>(value: T): Result<T, never> {
    return new Result((accept) => accept(value))
  }

  static reject<E>(value: E): Result<never, E> {
    return new Result((_, reject) => reject(value))
  }
}
