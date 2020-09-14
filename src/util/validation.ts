/** @hidden */
export type Validation<T, U> = [T, Array<U>]

/** @hidden */
export type Success<T> = Validation<T, never>

/** @hidden */
export type Failure<T> = Validation<any, T>

/** @hidden */
export const validation = <T = any, U = any>(value: T, errors: Array<U>): Validation<T, U> => [
  value,
  errors,
]

/** @hidden */
export const success = <T = any>(value: T): Success<T> => validation(value, [])

/** @hidden */
export const failure = <T = any>(errors: Array<T>): Failure<T> => validation(null, errors)
