import { literal } from 'isntnt'

type ResultResolver<T, E> = (
  accept: (value: T) => void,
  reject: (value: E) => void,
) => void

type Nothing = typeof nothing

const nothing = Symbol('Nothing')
const isNothing = literal(nothing)

export class Result<T, E> {
  value: T | Nothing = nothing
  error: E | Nothing = nothing
  constructor(resolver: ResultResolver<T, E>) {
    resolver(
      (value: T) => {
        this.value = value
      },
      (value: E) => {
        this.error = value
      },
    )
    if (isNothing(this.value) && isNothing(this.error)) {
      throw new Error(`Result must be resolved`)
    }
  }

  isSuccess(): this is Result<T, never> {
    return !isNothing(this.value)
  }

  isRejected(): this is Result<never, E> {
    return !isNothing(this.error)
  }

  static accept<T>(value: T): Result<T, never> {
    return new Result((accept) => accept(value))
  }

  static reject<E>(value: E): Result<never, E> {
    return new Result((_, reject) => reject(value))
  }
}
