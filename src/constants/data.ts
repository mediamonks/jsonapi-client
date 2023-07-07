// freeze empty (readonly) objects to get an Error when they're mutated,
// this indicates a logic error in the application
export const EMPTY_OBJECT = Object.freeze({});
export const EMPTY_ARRAY = Object.freeze([]);

export const EMPTY_STRING = '';
export const INCLUDE_PARAMETER_VALUE_DELIMITER = '.';
export const LIST_PARAMETER_VALUE_DELIMITER = ',';
export const PARAMETERS_DELIMITER = '&';
export const PARAMETER_DELIMITER = '=';
export const PARAMETER_PREFIX = '?';

export const __DEV__ = process.env.NODE_ENV !== 'production';

export enum DebugErrorCode {
  MISSING_FETCH_ADAPTER,
  INVALID_FIELD_NAME,
  FIELD_DOES_NOT_EXIST,
  FIELD_OF_WRONG_TYPE,
}

export enum ResourceDocumentKey {
  ID = 'id',
  TYPE = 'type',
  DATA = 'data',
  META = 'meta',
  ATTRIBUTES = 'attributes',
  RELATIONSHIPS = 'relationships',
  INCLUDED = 'included',
  ERRORS = 'errors',
  JSONAPI = 'jsonapi',
}
