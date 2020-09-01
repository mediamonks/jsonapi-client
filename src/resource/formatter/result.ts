import { createValidationErrorObject, ResourceValidationErrorObject } from '../../error'

/** @hidden */
export type Result<T, U> = readonly [T, Array<U>]

/** @hidden */
export type Success<T> = Result<T, never>

/** @hidden */
export type Failure<T> = Result<any, T>

/** @hidden */
export const result = <T = any, U = any>(value: T, errors: Array<U>): Result<T, U> => [
  value,
  errors,
]

/** @hidden */
export const success = <T = any>(value: T): Success<T> => result(value, [])

/** @hidden */
export const failure = <T = any>(errors: Array<T>): Failure<T> => result(null, errors)

/** @hidden */
export const validationFailure = (
  value: any,
  title: string,
  detail: string,
  pointer: ReadonlyArray<string>,
): Failure<ResourceValidationErrorObject> =>
  result(value, [createValidationErrorObject(title, detail, pointer)])
