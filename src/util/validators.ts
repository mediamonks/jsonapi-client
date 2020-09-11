import { either, isString, isObject, isArray, and, instance } from 'isntnt'

import { ResourceField } from '../resource/field'
import { Type, StaticType } from './type'
import { ResourceIdentifierKey } from '../types'
import { isURLString, isResourceType, isResourceIdentifierKey } from './predicates'
import { ResourceIdentifier } from '../resource/identifier'

/** @hidden */
export const array = Type.is('an array', isArray)

/** @hidden */
export const object = Type.is('an object', isObject)

/** @hidden */
export const string = Type.is('a string', isString)

/** @hidden */
export const urlString: Type<string> = Type.is('a valid url string', and(isString, isURLString))

/** @hidden */
export const url: Type<URL> = Type.is('a URL', instance(URL))

/** @hidden */
export const resourceType = Type.is('a valid resource type', isResourceType)

/** @hidden */
export const resourceId: Type<string> = string.withDescription('a valid resource id')

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
export const resourceField: Type<ResourceField<any, any>> = Type.instance(ResourceField)

/** @hidden */
export const resourceIdentifier: Type<ResourceIdentifier<string>> = Type.shape(
  'a resource identifier',
  {
    type: resourceType,
    id: resourceId,
  },
)

/** @hidden */
export const jsonapiObject = Type.shape('a jsonapi object', {
  version: Type.optional(Type.either('1.0')),
})

/** @hidden */
export const jsonapiSuccessDocument = Type.shape('a success resource document', {
  data: Type.or([array, object]),
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

type BaseJSONAPIDocument =
  | StaticType<typeof jsonapiSuccessDocument>
  | StaticType<typeof jsonapiFailureDocument>

/** @hidden */
export const jsonapiDocument: Type<BaseJSONAPIDocument> = Type.or([
  jsonapiSuccessDocument,
  jsonapiFailureDocument,
])

type BaseResourceCreateData = { type: string; id?: string }

export const resourceCreateData: Type<BaseResourceCreateData> = Type.shape('resource create data', {
  type: string,
  id: Type.optional(resourceId),
})

type BaseResourcePatchData = ResourceIdentifier<string>

export const resourcePatchData: Type<BaseResourcePatchData> = resourceIdentifier.withDescription(
  'resource patch data',
)

/** @hidden */
export const resourceObject = Type.shape('a resource object', {
  type: resourceType,
  id: resourceId,
  attributes: Type.optional(object),
  relationships: Type.optional(object),
  meta: Type.optional(object),
  links: Type.optional(object),
})
