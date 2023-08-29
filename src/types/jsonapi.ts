import { Maybe, Nullable, Serializable, SerializableObject, SerializablePrimitive } from 'isntnt'
import type {
  AttributeFieldName,
  RawAttributeFieldValue,
  RelationshipFieldName,
  RelationshipFieldResourceIdentifier,
  ResourceRelatedResources,
} from '.'
import type { RelationshipFieldType } from '../data/enum'
import type { ResourceFormatter } from '../formatter'
import type { AttributeField } from '../resource/field/attribute'
import type { RelationshipField } from '../resource/field/relationship'

export type ResourceType = string
export type ResourceId = string

export interface ResourceIdentifierObject<T extends ResourceType = ResourceType>
  extends SerializableObject {
  type: T
  id: ResourceId
  meta?: MetaObject
}

/**
 * JSONAPI-Client supports version 1.0 only
 * {@link https://jsonapi.org/faq/#what-is-the-meaning-of-json-apis-version|JSON:API Reference}
 */
export type Version = '1.0'

export interface BaseResourceDocument<T extends ResourceDocumentLinks | PaginationLinks> {
  links?: T
  jsonapi?: {
    version?: Version
  }
}

export interface BaseDataResourceDocument<T extends ResourceDocumentLinks | PaginationLinks>
  extends BaseResourceDocument<T> {
  errors?: never
  meta?: MetaObject
}

export interface BaseErrorResourceDocument
  extends BaseResourceDocument<ResourceDocumentLinks | PaginationLinks> {
  data?: never
  included?: never
}

/**
 * {@link https://jsonapi.org/format/#document-structure|JSON:API Reference}
 */
export type ResourceDocument<T extends ResourceFormatter = any> =
  | DataResourceDocument<T>
  | ErrorResourceDocument

type ManyResourceDocument<
  T extends ResourceFormatter = any
> = BaseDataResourceDocument<PaginationLinks> & {
  data: ReadonlyArray<ResourceObject<T>>
  included?: ReadonlyArray<ResourceObject<ResourceRelatedResources<T>>>
}

// TODO rename
export type JSONAPISuccessOfManyDocument<
  T extends ResourceFormatter = any
> = ManyResourceDocument<T>

type OneResourceDocument<
  T extends ResourceFormatter = any
> = BaseDataResourceDocument<ResourceDocumentLinks> & {
  data: ResourceObject<T>
  included?: ReadonlyArray<ResourceObject<ResourceRelatedResources<T>>>
}

export type DataResourceDocument<T extends ResourceFormatter = any> =
  | ManyResourceDocument<T>
  | OneResourceDocument<T>

export type ToOneRelatedResourceDocument<
  T extends ResourceFormatter = any
> = BaseDataResourceDocument<ResourceDocumentLinks> & {
  data: Nullable<ResourceIdentifierObject<T['type']>>
  included?: never
}

export type ToManyRelatedResourceDocument<
  T extends ResourceFormatter = any
> = BaseDataResourceDocument<ResourceDocumentLinks> & {
  data: ReadonlyArray<ResourceIdentifierObject<T['type']>>
  included?: never
}

export type RelatedResourceDocument<T extends ResourceFormatter = any> =
  | ToOneRelatedResourceDocument<T>
  | ToManyRelatedResourceDocument<T>

export type ErrorResourceDocument = BaseErrorResourceDocument & {
  errors: ReadonlyArray<ErrorObject>
  meta?: MetaObject
}

/**
 * {@link https://jsonapi.org/format/#document-resource-objects|JSON:API Reference}
 */
export type ResourceObject<T extends ResourceFormatter = any> = {
  type: T['type']
  id: ResourceId
  attributes?: ResourceObjectAttributes<T['fields']>
  relationships?: ResourceObjectRelationships<T['fields']>
  links?: ResourceDocumentLinks
  meta?: MetaObject
}

/**
 * {@link https://jsonapi.org/format/#crud-creating|JSON:API Reference}
 */
export interface ResourceCreateObject<T extends ResourceFormatter = any>
  extends SerializableObject {
  type: T['type']
  id?: ResourceId
  attributes?: ResourceObjectAttributes<T['fields']>
  relationships?: ResourceObjectRelationships<T['fields']>
  links?: ResourceDocumentLinks
  meta?: MetaObject
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-attributes|JSON:API Reference}
 */
export type ResourceObjectAttributes<T extends ResourceFormatter<any, any> = any> = {
  [P in AttributeFieldName<T>]?: T[P] extends AttributeField<any, any, any>
    ? RawAttributeFieldValue<T[P]>
    : never
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-relationships|JSON:API Reference}
 */
export type RelationshipFieldData<
  T extends RelationshipField<any, any, any> = any
> = T extends RelationshipField<any, RelationshipFieldType.ToOne, any>
  ? Nullable<RelationshipFieldResourceIdentifier<T> & { meta?: MetaObject }>
  : ReadonlyArray<RelationshipFieldResourceIdentifier<T> & { meta?: MetaObject }>

/**
 * {@link https://jsonapi.org/format/#document-resource-object-relationships|JSON:API Reference}
 */
export type ResourceObjectRelationships<T extends ResourceFormatter<any, any> = any> = Record<
  string,
  never
> &
  {
    [P in RelationshipFieldName<T>]?: {
      data?: T[P] extends RelationshipField<any, any, any> ? RelationshipFieldData<T[P]> : never
      links?: ResourceRelationshipLinks
      meta?: MetaObject
    }
  }

/**
 * {@link https://jsonapi.org/format/#document-jsonapi-object|JSON:API Reference}
 */
export interface JsonApiObject extends SerializableObject {
  version?: Version
}

/**
 * {@link https://jsonapi.org/format/#document-meta|JSON:API Reference}
 */
export interface MetaObject extends SerializableObject {}

/**
 * @deprecated use `MetaObject` instead
 */
export type JSONAPIMetaObject = MetaObject

/**
 * {@link https://jsonapi.org/format/#document-links|JSON:API Reference}
 */
export type Link = string | LinkObject

/**
 * {@link https://jsonapi.org/format/#document-links|JSON:API Reference}
 */
export interface LinkObject extends SerializableObject {
  href?: string
  meta?: MetaObject
}

/**
 * {@link https://jsonapi.org/format/#document-links|JSON:API Reference}
 */
export interface ResourceDocumentLinks extends SerializableObject {
  self?: Link
  related?: Link
}

/**
 * {@link https://jsonapi.org/format/#fetching-pagination|JSON:API Reference}
 */
export type PaginationLinks = ResourceDocumentLinks &
  {
    [P in 'first' | 'prev' | 'next' | 'last']: Nullable<Link>
  }

/**
 * {@link https://jsonapi.org/format/#document-resource-object-links|JSON:API Reference}
 */
export type ResourceObjectLinks = {
  [P in 'self']?: Link
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-links|JSON:API Reference}
 */
export type ResourceRelationshipLinks = {
  [P in 'self' | 'related']?: Link
}

/**
 * {@link https://jsonapi.org/format/#error-objects|JSON:API Reference}
 */
export type ErrorLinks = {
  [P in 'about']?: Link
}

/**
 * {@link https://jsonapi.org/format/#error-objects|JSON:API Reference}
 */
export interface ErrorObject {
  id?: string
  links?: ErrorLinks
  status?: string
  code?: string
  title?: string
  detail?: string
  meta?: MetaObject
  source?: {
    pointer?: string
    parameter?: string
  }
}

export type SearchParamValue =
  | SerializablePrimitive
  | ReadonlyArray<SerializablePrimitive>
  | {
      [name: string]: SearchParamValue
    }

type BaseSearchParams = {
  [name: string]: SearchParamValue
} & PageParam &
  SortParam &
  FilterParam & {
    fields?: never
    include?: never
  }

/**
 * {@link https://jsonapi.org/format/#fetching|JSON:API Reference}
 */
export type SearchParams<T extends BaseSearchParams = BaseSearchParams> = T

/**
 * @deprecated use `SearchParams` instead
 */
export type JSONAPISearchParams<T extends BaseSearchParams = BaseSearchParams> = T

export type PageParamValue = Maybe<string | number> | Record<string, string | number>

/**
 * {@link https://jsonapi.org/format/#fetching-pagination|JSON:API Reference}
 */
export interface PageParam<T extends PageParamValue = PageParamValue> {
  page?: Maybe<T>
}

export type SortParamValue = ReadonlyArray<string>

/**
 * {@link https://jsonapi.org/format/#fetching-sorting|JSON:API Reference}
 */
export interface SortParam {
  sort?: ReadonlyArray<string>
}

export type FilterParamValue = Maybe<string> | Record<string, Serializable>

/**
 * {@link https://jsonapi.org/format/#fetching-filtering|JSON:API Reference}
 */
export interface FilterParam<T extends FilterParamValue = FilterParamValue> {
  filter?: Maybe<T>
}
