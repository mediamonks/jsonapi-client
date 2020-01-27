export type JSONAPIVersion = '1.0' | '1.1'

export const jsonApiContentType = 'application/vnd.api+json'

export const defaultRequestHeaders = {
  ['Accept']: jsonApiContentType,
  ['Content-Type']: jsonApiContentType,
}
