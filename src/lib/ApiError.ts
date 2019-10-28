export class ApiError<T> extends Error {
  name: string = this.constructor.name // preserve name
  pointer: Array<string>
  value: T
  constructor(message: string, value: T, pointer: Array<string> = []) {
    super(message)
    this.value = value
    this.pointer = pointer
  }
}

export class ApiResponseError<T> extends ApiError<T> {}

export class ApiValidationError<T> extends ApiError<T> {}
