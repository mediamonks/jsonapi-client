import { either, isString, isObject, isArray, and, instance } from 'isntnt'

import { ResourceField } from '../resource/field'
import { Type } from '../type'
import { ResourceIdentifierKey } from '../types'
import { isURLString, isNotEmpty, isResourceType, isResourceIdentifierKey } from './predicates'

const array = Type.is('an array', isArray)
const object = Type.is('an object', isObject)

const string = Type.is('a string', isString)

/** @hidden */
export const nonEmptyStringArray: Type<Array<string>> = Type.and([
  Type.array(string),
  Type.is('not empty', isNotEmpty),
]) as any

/** @hidden */
export const urlString: Type<string> = Type.is('a valid url string', and(isString, isURLString))

/** @hidden */
export const url: Type<URL> = Type.is('a URL', instance(URL))

/** @hidden */
export const resourceType = Type.is('a valid resource type', isResourceType)

/** @hidden */
export const resourceIdentifierKey: Type<ResourceIdentifierKey> = Type.is(
  'a resource identifier key',
  either('type', 'id'),
)

/** @hidden */
export const resourceFieldName: Type<string> = Type.and([
  resourceType,
  Type.is(
    `a string other than "type" or "id"`,
    (value: unknown): value is string => !isResourceIdentifierKey(value),
  ),
])

/** @hidden */
export const resourceId: Type<string> = string.withDescription('a resource id')

/** @hidden */
export const resourceField: Type<ResourceField<any, any>> = Type.instance(ResourceField)

/** @hidden */
export const resourceIdentifier = Type.shape('a resource identifier', {
  type: resourceType,
  id: string,
})

const jsonapiObject = Type.shape('a jsonapi object', {
  version: Type.optional(Type.either('1.0')),
})

/** @hidden */
export const jsonapiSuccessDocument = Type.shape('a success resource document', {
  data: object,
  errors: Type.undefined,
  included: Type.optional(array),
  meta: Type.optional(object),
  links: Type.optional(object),
  jsonapi: Type.optional(jsonapiObject),
})

/** @hidden */
export const jsonapiFailureDocument = Type.shape('a failure resource document', {
  data: Type.undefined,
  errors: array,
  meta: Type.optional(object),
  links: Type.optional(object),
  jsonapi: Type.optional(jsonapiObject),
})

/** @hidden */
export const jsonapiDocument = Type.or([jsonapiSuccessDocument, jsonapiFailureDocument])

/** @hidden */
export const resourceObject = Type.shape('a resource object', {
  type: resourceType,
  id: string,
  attributes: Type.optional(object),
  relationships: Type.optional(object),
  meta: Type.optional(object),
  links: Type.optional(object),
})
