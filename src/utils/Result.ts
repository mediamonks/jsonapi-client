type ResultResolver<T, E> = (accept: (value: T) => void, reject: (value: E) => void) => void

enum ResultState {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class Result<T, E> {
  value!: T | E
  state!: ResultState
  constructor(resolver: ResultResolver<T, E>) {
    resolver(
      (value: T) => {
        if (!this.state) {
          this.value = value
          this.state = ResultState.ACCEPTED
        }
      },
      (value: E) => {
        if (!this.state) {
          this.value = value
          this.state = ResultState.REJECTED
        }
      },
    )
    if (!this.state) {
      throw new Error(`Result must be resolved`)
    }
  }

  isSuccess(): this is Result<T, never> {
    return this.state === ResultState.ACCEPTED
  }

  isRejected(): this is Result<never, E> {
    return this.state === ResultState.REJECTED
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
