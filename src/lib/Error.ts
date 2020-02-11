export class JSONAPIError<T> extends Error {
  name: string = this.constructor.name // preserve name
  pointer: ReadonlyArray<string>
  value: T
  constructor(message: string, value: T, pointer: ReadonlyArray<string> = []) {
    super(message)
    this.value = value
    this.pointer = pointer
  }
}

export class JSONAPIRequestError<T> extends JSONAPIError<T> {}

export class JSONAPIResponseError<T> extends JSONAPIError<T> {}

export class JSONAPIValidationError<T> extends JSONAPIError<T> {}
