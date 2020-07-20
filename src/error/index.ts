import { or, isNumber, isString, isSome } from 'isntnt'
import { JSONAPIErrorObject, JSONAPIMetaObject } from '../types'

const isContent = or(isNumber, isString)

export type ErrorDetail = ResourceValidationErrorDetail | ClientResponseError

// Error Pointer
const ATTRIBUTES_POINTER_ROOT = Object.freeze(['attributes', 'data'])
const RELATIONSHIPS_POINTER_ROOT = Object.freeze(['relationships', 'data'])

export const getErrorPointerRoot = (pointer: string): ReadonlyArray<string> => {
  if (pointer.startsWith('attributes/data')) {
    return ATTRIBUTES_POINTER_ROOT
  }
  if (pointer.startsWith('relationships/data')) {
    return RELATIONSHIPS_POINTER_ROOT
  }
  return Object.freeze(pointer.split('/'))
}

export const getErrorPointerPath = (pointer: string): ReadonlyArray<string> => {
  return []
}

export class ErrorPointer {
  root: ReadonlyArray<string>
  path: ReadonlyArray<string>

  constructor(pointer: string) {
    this.root = getErrorPointerRoot(pointer)
    this.path = getErrorPointerPath(pointer)
  }

  toString() {
    return this.root.concat(this.path).join('/')
  }
}

// Client Response Error
export type ClientResponseErrorDetail = {
  id: string | null
  code: string | null
  title: string | null
  detail: string | null
  status: string | null
  source: {
    pointer: ErrorPointer
    parameter: string | null
  }
  meta: JSONAPIMetaObject
}

export class ClientResponseError extends Error {
  readonly name = 'ClientResponseError'
  readonly actual: unknown
  readonly details: ReadonlyArray<ClientResponseErrorDetail>

  constructor(message: string, value: unknown, errors: Array<JSONAPIErrorObject>) {
    super(message)
    this.actual = value
    this.details = errors.map(toClientResponseErrorDetail)
  }
}

const toClientResponseErrorDetail = (error: JSONAPIErrorObject): ClientResponseErrorDetail => {
  return {
    id: isContent(error.id) ? String(error.id) : null,
    code: isContent(error.code) ? String(error.code) : null,
    status: isContent(error.status) ? String(error.status) : null,
    title: isString(error.title) ? error.title : null,
    detail: isString(error.detail) ? error.detail : null,
    meta: isSome(error.meta) ? error.meta : {},
    source: {
      pointer: new ErrorPointer(error.source?.pointer ?? ''),
      parameter: isSome(error.source?.parameter) ? error.source!.parameter : null,
    },
  }
}

// Resource Validation Error
export type ResourceValidationErrorDetail = {
  code: string | null
  title: string
  detail: string
  source: {
    pointer: ErrorPointer
  }
}

export class ResourceValidationError extends Error {
  readonly name = 'ResourceValidationError'
  readonly actual: unknown
  readonly details: ReadonlyArray<ResourceValidationErrorDetail>

  constructor(message: string, value: unknown, details: Array<ResourceValidationErrorDetail>) {
    super(message)
    this.actual = value
    this.details = details
  }
}
