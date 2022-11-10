/** @hidden */
export type Validation<T, U> = [T, ReadonlyArray<U>]

/** @hidden */
export type Success<T> = Validation<T, never>

/** @hidden */
export type Failure<T> = Validation<never, T>

/** @hidden */
export const validation = <T = any, U = any>(
  value: T,
  errors: ReadonlyArray<U>,
): Validation<T, U> => [value, errors]

/** @hidden */
export const success = <T = any>(value: T): Success<T> => validation(value, [])

/** @hidden */
export const failure = <T = any>(errors: ReadonlyArray<T>): Failure<T> =>
  validation(null as never, errors)
