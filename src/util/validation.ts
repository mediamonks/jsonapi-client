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

// export const map = <T extends Result<any, any>, U>(
//   result: T,
//   transform: (value: T[0]) => U,
// ): Result<U, T[1]> => (result[1].length ? result : [transform(result[0]), result[1]])

// export const unwrap = <T extends Result<any, any>>([value, errors]: T): T[0] => {
//   if (errors.length) {
//     throw errors
//   }
//   return value
// }
