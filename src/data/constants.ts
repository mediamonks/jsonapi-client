import { ReadonlyRecord } from '../types'

export const JSON_API_MIME_TYPE = 'application/vnd.api+json'

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
