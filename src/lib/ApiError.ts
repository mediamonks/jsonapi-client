export class ApiError<T> extends Error {
  pointer: Array<string>
  value: T
  constructor(message: string, value: T, pointer: Array<string> = []) {
    super(message)
    this.value = value
    this.pointer = pointer
  }
}
