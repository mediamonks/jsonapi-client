type ReadonlyRecord<K extends keyof any, T> = {
  readonly [P in K]: T
}

/**
 * Object is frozen to catch accidental mutations
 * @hidden
 */
export const EMPTY_OBJECT: ReadonlyRecord<any, any> = Object.freeze({})

/**
 * Array is frozen to catch accidental mutations
 * @hidden
 */
export const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([])
