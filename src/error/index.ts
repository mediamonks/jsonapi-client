import { isString, isSome } from 'isntnt'

import { JSONAPIErrorObject, JSONAPIMetaObject } from '../types'
import { isContent } from '../util/predicates'

export type ErrorObjectPointer = ReadonlyArray<string>

export type ResourceDocumentErrorObject = {
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

export class ResourceDocumentError extends Error {
  readonly actual: unknown
  readonly details: ReadonlyArray<ResourceDocumentErrorObject>

  constructor(message: string, value: unknown, errors: ReadonlyArray<JSONAPIErrorObject>) {
    super(message)
    this.actual = value
    this.details = errors.map(createResourceDocumentErrorObject)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** @hidden */
export const createResourceDocumentErrorObject = (
  error: JSONAPIErrorObject,
): ResourceDocumentErrorObject => {
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
    value: unknown
    pointer: ErrorObjectPointer
  }
}

/** @hidden */
export const createValidationErrorObject = (
  title: string,
  detail: string,
  pointer: ErrorObjectPointer,
  value: unknown,
): ResourceValidationErrorObject => {
  return {
    title,
    detail,
    source: {
      pointer,
      value,
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
