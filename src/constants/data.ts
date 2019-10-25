// freeze empty (readonly) objects to get an Error when they're mutated,
// this indicates a logic error in the application
export const EMPTY_OBJECT = Object.freeze({})
export const EMPTY_ARRAY = Object.freeze([])

export const EMPTY_STRING = ''
export const INCLUDE_PARAMETER_VALUE_DELIMITER = '.'
export const LIST_PARAMETER_VALUE_DELIMITER = ','
export const PARAMETERS_DELIMITER = '&'
export const PARAMETER_DELIMITER = '='
export const PARAMETER_PREFIX = '?'
