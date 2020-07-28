import { either, isString, test, at, min, isAny, isObject, optional, isArray } from 'isntnt'

import { ResourceField } from '../resource/field'
import { Type } from '../type'
import { ResourceFields, ResourceIdentifierKey } from '../types'

const array = Type.is('an array', isArray)
const object = Type.is('an object', isObject)

const string = Type.is('a string', isString)

const notEmpty = Type.is('not empty', at('length', min(1)))

/** @hidden */
export const nonEmptyStringArray: Type<Array<string>> = Type.and([
  Type.array(string),
  notEmpty,
]) as any

/** @hidden */
export const resourceType = Type.is(
  'a valid resource type',
  test(/^[^-_ ]([a-zA-Z0-9][^+,\.\[\]!"#$%&'\(\)\/*:;<=>?@\\^`{|}~]+)+[^-_ ]$/),
)

const resourceIdentifierKey: Type<ResourceIdentifierKey> = Type.is(
  'a resource identifier key',
  either('type', 'id'),
)

const legalFieldName: Type<string> = Type.is(
  `a string other than "type" or "id"`,
  (value: unknown): value is string => !resourceIdentifierKey.predicate(value),
)

/** @hidden */
export const resourceFieldName: Type<string> = Type.is('any', isAny)

/** @hidden */
export const resourceId: Type<string> = string.withDescription('a resource id')

/** @hidden */
export const resourceField: Type<ResourceField<any, any>> = Type.instance(ResourceField)

/** @hidden */
export const parseResourceFields = <T extends ResourceFields>(fields: T): T =>
  Object.keys(fields).reduce((pureFields, key) => {
    const fieldName = resourceFieldName.withPointer([key]).parse(key)
    pureFields[fieldName] = resourceField.withPointer([key]).parse(fields[fieldName])
    return pureFields
  }, Object.create(null))

export const resourceIdentifier = Type.shape('a resource identifier', {
  type: resourceType,
  id: string,
})

const jsonapiObject = Type.shape('a jsonapi object', {
  version: Type.optional(Type.either('1.0')),
})

const jsonapiSuccessDocument = Type.shape('a success resource document', {
  data: object,
  errors: Type.undefined,
  included: Type.optional(array),
  meta: Type.optional(object),
  links: Type.optional(object),
  jsonapi: Type.optional(jsonapiObject),
})

const jsonapiFailureDocument = Type.shape('a failure resource document', {
  data: Type.undefined,
  errors: array,
  meta: Type.optional(object),
  links: Type.optional(object),
  jsonapi: Type.optional(jsonapiObject),
})

/** @hidden */
export const jsonapiDocument = Type.or([jsonapiSuccessDocument, jsonapiFailureDocument])

export const resourceObject = Type.shape('a resource object', {
  type: resourceType,
  id: string,
  attributes: Type.optional(object),
  relationships: Type.optional(object),
  meta: Type.optional(object),
  links: Type.optional(object),
})
