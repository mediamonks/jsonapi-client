import { or, isNumber, isString, isSome } from 'isntnt'
import { JSONAPIErrorObject, JSONAPIMetaObject } from '../types'

const isContent = or(isNumber, isString)

// Client Response Error
export type ErrorObjectPointer = ReadonlyArray<string>

export type ClientResponseErrorObject = {
  id: string | null
  code: string | null
  title: string | null
  detail: string | null
  status: string | null
  source: {
    pointer: ErrorObjectPointer
    parameter: string | null
  }
  meta: JSONAPIMetaObject
}

export class ClientResponseError extends Error {
  readonly actual: unknown
  readonly details: ReadonlyArray<ClientResponseErrorObject>

  constructor(message: string, value: unknown, errors: ReadonlyArray<JSONAPIErrorObject>) {
    super(message)
    this.actual = value
    this.details = errors.map(createClientResponseErrorObject)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** @hidden */
export const createClientResponseErrorObject = (
  error: JSONAPIErrorObject,
): ClientResponseErrorObject => {
  return {
    id: isContent(error.id) ? String(error.id) : null,
    code: isContent(error.code) ? String(error.code) : null,
    status: isContent(error.status) ? String(error.status) : null,
    title: isString(error.title) ? error.title : null,
    detail: isString(error.detail) ? error.detail : null,
    meta: isSome(error.meta) ? error.meta : {},
    source: {
      pointer: error.source?.pointer ? error.source.pointer.split('/') : [],
      parameter: isSome(error.source?.parameter) ? error.source!.parameter : null,
    },
  }
}

export type ResourceValidationErrorObject = {
  title: string
  detail: string
  source: {
    pointer: ErrorObjectPointer
  }
}

/** @hidden */
export const createValidationErrorObject = (
  title: string,
  detail: string,
  pointer: ErrorObjectPointer,
): ResourceValidationErrorObject => {
  return {
    title,
    detail,
    source: {
      pointer,
    },
  }
}

export class ResourceValidationError extends Error {
  readonly actual: unknown
  readonly details: ReadonlyArray<ResourceValidationErrorObject>

  constructor(
    message: string,
    value: unknown,
    details: ReadonlyArray<ResourceValidationErrorObject>,
  ) {
    super(message)
    this.actual = value
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
