import { ReadonlyRecord } from '../types'

/**
 * {@link https://jsonapi.org/format/#introduction|JSON:API Reference}
 */
export const JSON_API_MIME_TYPE = 'application/vnd.api+json'

/**
 * {@link https://jsonapi.org/faq/#wheres-put|JSON:API Reference}
 */
export enum JSONAPIRequestMethod {
  Get = 'GET',
  Post = 'POST',
  Patch = 'PATCH',
  Delete = 'DELETE',
}

export enum JSONAPIStatusCode {
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  NotAcceptable = 406,
  UnsupportedMediaType = 415,
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

// Experimental
/** @hidden */
export enum InternalErrorCode {
  UnexpectedError,
  DeprecatedFunctionality,
  InvalidClientSetupType,
  InvalidClientSetupAbsolutePathRootType,
  InvalidClientSetupImplicitIncludesType,
  InvalidClientSetupInitialRelationshipDataType,
  InvalidClientSetupRelationshipLinksType,
  InvalidClientSetupTransformRelationshipPathType,
  InvalidClientSetupBeforeRequestType,
  InvalidClientSetupBeforeRequestURLType,
  InvalidClientSetupBeforeRequestHeadersType,
  InvalidClientSetupAfterRequestType,
  InvalidClientSetupFetchAdapterType,
}
