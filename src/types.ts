import {
  SerializableArray,
  SerializablePrimitive,
  SerializableObject,
  Intersect,
  Serializable,
  Predicate,
} from 'isntnt'

import { ResourceField, ResourceFieldFlag, ResourceFieldRule } from './resource/field'
import { AttributeField } from './resource/field/attribute'
import { RelationshipField, RelationshipFieldType } from './resource/field/relationship'
import { ResourceFormatter } from './resource/formatter'
import { ResourceIdentifier } from './resource/identifier'

// Util

/** @hidden */
export type NonEmptyReadonlyArray<T> = ReadonlyArray<T> & { 0: T }

// Resource
export type ResourceType = string
export type ResourceId = string

export type ResourcePath = string

export type ResourceIdentifierKey = keyof ResourceIdentifier<any>

export type Resource<T extends ResourceFormatter<any, any>> = ResourceIdentifier<T['type']> &
  ResourceFieldValues<T['fields']>

type BaseRelationshipFieldValueWrapper<T, U, V> = V extends ResourceFieldFlag.AlwaysGet
  ? U extends RelationshipFieldType.ToOne
    ? T
    : Array<T>
  : V extends ResourceFieldFlag.MaybeGet
  ? U extends RelationshipFieldType.ToOne
    ? T | null
    : Array<T>
  : never

type FilteredResourceFieldName<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFilter<T>
> = T['type'] extends keyof U['fields'] ? U['fields'][T['type']][number] : keyof T['fields']

export type FilteredResource<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFilter<T> = {}
> = ResourceIdentifier<T['type']> &
  {
    [P in FilteredResourceFieldName<T, U>]: T['fields'][P] extends RelationshipField<
      infer R,
      infer S,
      infer V
    >
      ? BaseRelationshipFieldValueWrapper<
          {
            [K in R['type']]: P extends keyof U['include']
              ? FilteredResource<
                  Extract<R, { type: K }>,
                  { fields: U['fields']; include: U['include'][P] }
                >
              : ResourceIdentifier<K>
          }[R['type']],
          S,
          V
        >
      : T['fields'][P] extends AttributeField<infer R, any, infer S>
      ? S extends ResourceFieldFlag.AlwaysGet
        ? R
        : S extends ResourceFieldFlag.MaybeGet
        ? R | null
        : never
      : never
  }

export type ResourceConstructorData<T extends ResourceType, U extends ResourceFields> = Resource<
  ResourceFormatter<T, U>
>

type MonoResourceCreateData<T extends ResourceFormatter<any, any>> = {
  id?: ResourceId
  type: T['type']
} & {
  [P in ResourceFieldNameWithFlag<
    T['fields'],
    ResourceFieldFlag.AlwaysPost
  >]: ResourceFieldCreateValue<T['fields'][P]>
} &
  {
    [P in ResourceFieldNameWithFlag<
      T['fields'],
      ResourceFieldFlag.MaybePost
    >]?: ResourceFieldCreateValue<T['fields'][P]>
  } &
  {
    [P in ResourceFieldNameWithFlag<
      T['fields'],
      ResourceFieldFlag.NeverPost
    >]?: JSONAPIClient.IllegalField<
      'Field with NeverPost flag must be omitted from ResourceCreateData',
      T['fields'][P]
    >
  }

export type ResourceCreateData<T extends ResourceFormatter<any, any>> = {
  [P in T['type']]: MonoResourceCreateData<Extract<T, { type: P }>>
}[T['type']]

type MonoResourcePatchData<T extends ResourceFormatter<any, any>> = {
  id?: ResourceId
  type: T['type']
} & {
  [P in ResourceFieldNameWithFlag<
    T['fields'],
    ResourceFieldFlag.AlwaysPatch
  >]: ResourceFieldPatchValue<T['fields'][P]>
} &
  {
    [P in ResourceFieldNameWithFlag<
      T['fields'],
      ResourceFieldFlag.MaybePatch
    >]?: ResourceFieldPatchValue<T['fields'][P]>
  } &
  {
    [P in ResourceFieldNameWithFlag<
      T['fields'],
      ResourceFieldFlag.NeverPatch
    >]?: JSONAPIClient.IllegalField<
      'Field with NeverPatch flag must be omitted from ResourcePatchData',
      T['fields'][P]
    >
  }

export type ResourcePatchData<T extends ResourceFormatter<any, any>> = {
  [P in T['type']]: MonoResourcePatchData<Extract<T, { type: P }>>
}[keyof T]

//
export type ExperimentalResourceQuery<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldsQuery<T>,
  V extends ResourceIncludeQuery<T>
> = {
  [P in 'fields']?: U
} &
  {
    [P in 'include']?: V
  }

type BaseResourceFieldsResources<T> = T extends ResourceFields
  ? {
      [P in keyof T]: T[P] extends RelationshipField<infer R, any, any> ? R : never
    }[keyof T]
  : never

type BaseResourceRelatedResources<T, U extends ResourceType> = T extends ResourceFormatter<
  any,
  infer R
>
  ? {
      [P in keyof R]: R[P] extends RelationshipField<infer S, any, any>
        ? S | BaseResourceFieldsRelatedResources<S['fields'], U | S['type']>
        : never
    }[keyof R]
  : never

type BaseResourceFieldsRelatedResources<T, U extends ResourceType> = T extends ResourceFields
  ? {
      [P in BaseResourceFieldsResources<T>['type']]: P extends U
        ? never
        :
            | Extract<BaseResourceFieldsResources<T>, { type: P }>
            | BaseResourceRelatedResources<
                Extract<BaseResourceFieldsResources<T>, { type: P }>,
                U | BaseResourceFieldsResources<T>['type']
              >
    }[BaseResourceFieldsResources<T>['type']]
  : never

export type ResourceRelatedResources<
  T extends ResourceFormatter<any, any>
> = BaseResourceFieldsRelatedResources<T['fields'], never>

// ResourceFilter
export type ResourceFilter<T extends ResourceFormatter<any, any>> = {
  [P in 'fields']?: ResourceFieldsQuery<T>
} &
  {
    [P in 'include']?: ResourceIncludeQuery<T>
  }

// Query
export type ResourceQueryParams = ResourceFilter<any>

type BaseResourcesFieldsQuery<T> = T extends ResourceFormatter<any, any>
  ? {
      [P in T['type']]?: NonEmptyReadonlyArray<
        ResourceFieldNameWithFlag<
          Extract<T, { type: P }>['fields'],
          ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.MaybeGet
        >
      >
    }
  : never

export type ResourceFieldsQuery<T extends ResourceFormatter<any, any>> = Intersect<
  BaseResourcesFieldsQuery<ResourceRelatedResources<T>>
>

type ExperimentalResourceIncludeQuery<
  T extends ResourceFormatter<any, any> = any,
  U extends ResourceFieldsQuery<T> | {} = {}
> = {
  [P in keyof T['fields']]?: T['fields'][P] extends RelationshipField<
    any,
    any,
    ResourceFieldFlag.NeverGet
  >
    ? JSONAPIClient.IllegalField<
        'Field with NeverGet flag must be omitted from ResourceIncludeQuery',
        T[P]
      >
    : T['fields'][P] extends RelationshipField<infer R, any, any>
    ? T['type'] extends keyof U
      ? P extends U[T['type']][number]
        ? ExperimentalResourceIncludeQuery<R, U> | null
        : JSONAPIClient.IllegalField<
            'Field must be present in ResourceIncludeQuery',
            { [P in T['type']]: U[T['type']] }
          >
      : ExperimentalResourceIncludeQuery<R, U> | null
    : JSONAPIClient.IllegalField<'Field must be a RelationshipField', T['fields'][P]>
}

export type ResourceIncludeQuery<T extends ResourceFormatter<any, any> = any> = {
  [P in keyof T['fields']]?: T['fields'][P] extends RelationshipField<
    any,
    any,
    ResourceFieldFlag.NeverGet
  >
    ? JSONAPIClient.IllegalField<
        'Field with NeverGet flag must be omitted from ResourceIncludeQuery',
        T[P]
      >
    : T['fields'][P] extends RelationshipField<infer R, any, any>
    ? ResourceIncludeQuery<R> | null
    : JSONAPIClient.IllegalField<'Field must be a RelationshipField', T['fields'][P]>
}

// Fields
export type ResourceFields = {
  [name: string]: AttributeField<any, any, any> | RelationshipField<any, any, any>
}

export type ResourceFieldValues<T extends ResourceFields> = {
  [P in keyof T]: ResourceFieldValue<T[P]>
}

export type ResourceFieldValue<T extends ResourceField<any, any>> = T extends AttributeField<
  any,
  any,
  any
>
  ? AttributeFieldValue<T>
  : T extends RelationshipField<any, any, any>
  ? RelationshipFieldValue<T>
  : never

export type ResourceFieldCreateValue<
  T extends ResourceField<any, any>
> = T extends RelationshipField<any, any, any>
  ? RelationshipCreateData<T>
  : T extends AttributeField<any, any, any>
  ? AttributeFieldCreateValue<T>
  : never

export type ResourceFieldPatchValue<
  T extends ResourceField<any, any>
> = T extends RelationshipField<any, any, any>
  ? RelationshipPatchData<T>
  : T extends AttributeField<any, any, any>
  ? AttributeFieldPatchValue<T>
  : never

export type ResourceFieldNameWithFlag<T extends ResourceFields, U extends ResourceFieldFlag> = {
  [P in keyof T]: T[P] extends ResourceField<any, infer R> ? (R extends U ? P : never) : never
}[keyof T]

export type ResourceFieldFactoryRules = [ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]

export type ResourceFieldGetMask =
  | ResourceFieldFlag.NeverGet
  | ResourceFieldFlag.MaybeGet
  | ResourceFieldFlag.AlwaysGet

export type ResourceFieldPostMask =
  | ResourceFieldFlag.NeverPost
  | ResourceFieldFlag.MaybePost
  | ResourceFieldFlag.AlwaysPost

export type ResourceFieldPatchMask =
  | ResourceFieldFlag.NeverPatch
  | ResourceFieldFlag.MaybePatch
  | ResourceFieldFlag.AlwaysPatch

export type ResourceFieldNeverMask =
  | ResourceFieldFlag.NeverGet
  | ResourceFieldFlag.NeverPost
  | ResourceFieldFlag.NeverPatch

export type ResourceFieldMaybeMask =
  | ResourceFieldFlag.MaybeGet
  | ResourceFieldFlag.MaybePost
  | ResourceFieldFlag.MaybePatch

export type ResourceFieldAlwaysMask =
  | ResourceFieldFlag.AlwaysGet
  | ResourceFieldFlag.AlwaysPost
  | ResourceFieldFlag.AlwaysPatch

// Attributes
export type AttributeValue =
  | SerializablePrimitive
  | SerializableArray
  | (SerializableObject & {
      fields?: never
    })

export type AttributeValueFormatter<T extends AttributeValue, U> = {
  serialize: (value: U) => T
  deserialize: (value: T) => U
}

export type AttributeFieldValue<T extends AttributeField<any, any, any>> = T extends AttributeField<
  infer R,
  any,
  any
>
  ? R
  : never

export type RawAttributeFieldValue<
  T extends AttributeField<any, any, any>
> = T extends AttributeField<any, infer R, any> ? R : never

export type AttributeFieldCreateValue<
  T extends AttributeField<any, any, any>
> = T extends AttributeField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.MaybePost | ResourceFieldFlag.AlwaysPost
    ? R
    : never
  : never

export type AttributeFieldPatchValue<
  T extends AttributeField<any, any, any>
> = T extends AttributeField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.MaybePatch
    ? R | null
    : S extends ResourceFieldFlag.AlwaysPatch
    ? R
    : never
  : never

export type AttributeFieldName<T extends ResourceFields> = {
  [P in keyof T]: T[P] extends AttributeField<any, any, any> ? P : never
}[keyof T]

export type AttributeFieldNameWithFlag<
  T extends ResourceFields,
  U extends ResourceFieldFlag
> = ResourceFieldNameWithFlag<Pick<T, AttributeFieldName<T>>, U>

export type AttributeFieldFactory = (
  type: AttributeFieldValidator<any>,
) => AttributeField<any, any, any>

export type AttributeFieldFromFactory<
  T extends AttributeValue,
  U,
  V extends AttributeFieldFactory
> = ReturnType<V> extends AttributeField<any, any, infer R> ? AttributeField<U, T, R> : never

export type AttributeFieldValidator<T> = {
  predicate: Predicate<T>
  validate: (value: unknown) => ReadonlyArray<string>
}

// Relationships
export type RelationshipValue = Resource<any> | null | Array<Resource<any>>

export type RelationshipFieldValue<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<infer R, RelationshipFieldType.ToOne, any>
  ?
      | {
          [P in R['type']]: ResourceConstructorData<P, Extract<R, { type: P }>['fields']>
        }[R['type']]
      | null
  : T extends RelationshipField<infer R, RelationshipFieldType.ToOne, any>
  ? Array<
      {
        [P in R['type']]: ResourceConstructorData<P, Extract<R, { type: P }>['fields']>
      }[R['type']]
    >
  : never

export type RelationshipCreateData<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<any, infer R, any>
  ? R extends RelationshipFieldType.ToOne
    ? ToOneRelationshipCreateData<T>
    : R extends RelationshipFieldType.ToMany
    ? ToManyRelationshipCreateData<T>
    : never
  : never

export type ToOneRelationshipCreateData<
  T extends RelationshipField<any, RelationshipFieldType.ToOne, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.MaybePost | ResourceFieldFlag.AlwaysPost
    ? ResourceIdentifier<R['type']>
    : never
  : never

export type ToManyRelationshipCreateData<
  T extends RelationshipField<any, RelationshipFieldType.ToMany, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.MaybePatch | ResourceFieldFlag.AlwaysPatch
    ? Array<ResourceIdentifier<R['type']>>
    : never
  : never

export type RelationshipPatchData<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<any, infer R, any>
  ? R extends RelationshipFieldType.ToOne
    ? ToOneRelationshipPatchData<T>
    : R extends RelationshipFieldType.ToMany
    ? ToManyRelationshipPatchData<T>
    : never
  : never

export type ToOneRelationshipPatchData<
  T extends RelationshipField<any, RelationshipFieldType.ToOne, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.MaybePatch
    ? ResourceIdentifier<R['type']> | null
    : S extends ResourceFieldFlag.AlwaysPatch
    ? ResourceIdentifier<R['type']>
    : never
  : never

export type ToManyRelationshipPatchData<
  T extends RelationshipField<any, RelationshipFieldType.ToMany, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.MaybePatch | ResourceFieldFlag.AlwaysPatch
    ? Array<ResourceIdentifier<R['type']>>
    : never
  : never

export type RelationshipFieldResourceConstructor<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<infer R, any, any> ? R : never

export type RelationshipFieldResourceIdentifier<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<infer R, any, any>
  ?
      | {
          [P in R['type']]: ResourceIdentifier<P>
        }[R['type']]
      | null
  : never

export type RelationshipFieldName<T extends ResourceFields> = {
  [P in keyof T]: T[P] extends RelationshipField<any, any, any> ? P : never
}[keyof T]

export type RelationshipFieldNameWithFlag<
  T extends ResourceFields,
  U extends ResourceFieldFlag
> = ResourceFieldNameWithFlag<Pick<T, RelationshipFieldName<T>>, U>

export type ToOneRelationshipFieldNames<T extends ResourceFields> = {
  [P in keyof T]: T[P] extends RelationshipField<any, infer R, any>
    ? R extends RelationshipFieldType.ToOne
      ? P
      : never
    : never
}[keyof T]

export type ToOneRelationshipFieldNameWithFlag<
  T extends ResourceFields,
  U extends ResourceFieldFlag = any
> = ResourceFieldNameWithFlag<Pick<T, ToOneRelationshipFieldNames<T>>, U>

export type ToManyRelationshipFieldName<T extends ResourceFields> = {
  [P in keyof T]: T[P] extends RelationshipField<any, infer R, any>
    ? R extends RelationshipFieldType.ToMany
      ? P
      : never
    : never
}[keyof T]

export type ToManyRelationshipFieldNameWithFlag<
  T extends ResourceFields,
  U extends ResourceFieldFlag
> = ResourceFieldNameWithFlag<Pick<T, ToManyRelationshipFieldName<T>>, U>

export type RelationshipFieldFactory = (
  getResources: () => NonEmptyReadonlyArray<ResourceFormatter<any, any>>,
) => RelationshipField<any, RelationshipFieldType, any>

export type ToOneRelationshipFieldFromFactory<
  T extends ResourceFormatter<any, any>,
  U extends RelationshipFieldFactory
> = ReturnType<U> extends RelationshipField<any, any, infer R>
  ? RelationshipField<T, RelationshipFieldType.ToOne, R>
  : never

export type ToManyRelationshipFieldFromFactory<
  T extends ResourceFormatter<any, any>,
  U extends RelationshipFieldFactory
> = ReturnType<U> extends RelationshipField<any, any, infer R>
  ? RelationshipField<T, RelationshipFieldType.ToMany, R>
  : never

// JSONAPI
/**
 * JSONAPI-Client supports version 1.0 only
 * {@link https://jsonapi.org/faq/#what-is-the-meaning-of-json-apis-version|JSON:API Reference}
 */
export type JSONAPIVersion = '1.0'

/**
 * {@link https://jsonapi.org/format/#document-structure|JSON:API Reference}
 */
export type JSONAPIDocument<
  T extends ResourceFormatter<any, any> | Array<ResourceFormatter<any, any>> = any
> = (
  | ((
      | {
          // data and errors are mutually exclusive
          data: JSONAPIResourceObject<
            T extends ResourceFormatter<any, any>
              ? T
              : T extends Array<ResourceFormatter<any, any>>
              ? T[number]
              : never
          >
          included?: Array<
            JSONAPIResourceObject<
              ResourceRelatedResources<
                T extends ResourceFormatter<any, any>
                  ? T
                  : T extends Array<ResourceFormatter<any, any>>
                  ? T[number]
                  : never
              >
            >
          >
          errors?: never
        }
      | {
          data?: never
          included?: never
          errors: Array<JSONAPIErrorObject>
        }
    ) & {
      meta?: JSONAPIMetaObject
    })
  | {
      meta: JSONAPIMetaObject
    }
) & {
  jsonapi?: {
    version?: JSONAPIVersion
  }
  links?: JSONAPILinksObject
}

/**
 * {@link https://jsonapi.org/format/#document-resource-objects|JSON:API Reference}
 */
export type JSONAPIResourceObject<T extends ResourceFormatter<any, any> = any> = {
  type: T['type']
  id: ResourceId
  attributes?: JSONAPIResourceObjectAttributes<T['fields']>
  relationships?: JSONAPIResourceObjectRelationships<T['fields']>
  links?: JSONAPILinksObject
  meta?: JSONAPIMetaObject
}

/**
 * {@link https://jsonapi.org/format/#crud-creating|JSON:API Reference}
 */
export type JSONAPIResourceCreateObject<T extends ResourceFormatter<any, any> = any> = {
  type: T['type']
  id?: ResourceId
  attributes?: JSONAPIResourceObjectAttributes<T['fields']>
  relationships?: JSONAPIResourceObjectRelationships<T['fields']>
  links?: JSONAPILinksObject
  meta?: JSONAPIMetaObject
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-attributes|JSON:API Reference}
 */
export type JSONAPIResourceObjectAttributes<T extends ResourceFields = any> = {
  [P in AttributeFieldName<T>]?: RawAttributeFieldValue<T[P]>
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-relationships|JSON:API Reference}
 */
export type JSONAPIRelationshipData<
  T extends RelationshipField<any, any, any> = any
> = T extends RelationshipField<any, RelationshipFieldType.ToOne, any>
  ? (RelationshipFieldResourceIdentifier<T> & { meta?: JSONAPIMetaObject }) | null
  : Array<RelationshipFieldResourceIdentifier<T> & { meta?: JSONAPIMetaObject }>

/**
 * {@link https://jsonapi.org/format/#document-resource-object-relationships|JSON:API Reference}
 */
export type JSONAPIResourceObjectRelationships<T extends ResourceFields = any> = {
  [P in RelationshipFieldName<T>]?: {
    data?: JSONAPIRelationshipData<T[P]>
    links?: JSONAPIResourceLinks
    meta?: JSONAPIMetaObject
  }
}

/**
 * {@link https://jsonapi.org/format/#document-jsonapi-object|JSON:API Reference}
 */
export type JSONAPIObject = JSONAPIMetaObject & {
  version?: JSONAPIVersion
}

/**
 * {@link https://jsonapi.org/format/#document-meta|JSON:API Reference}
 */
export type JSONAPIMetaObject = SerializableObject

/**
 * {@link https://jsonapi.org/format/#document-links|JSON:API Reference}
 */
export type JSONAPILink =
  | string
  | {
      href?: string
      meta?: JSONAPIMetaObject
    }

/**
 * {@link https://jsonapi.org/format/#document-links|JSON:API Reference}
 */
export type JSONAPILinksObject = {
  [P in 'self' | 'related']?: JSONAPILink
}

/**
 * {@link https://jsonapi.org/format/#fetching-pagination|JSON:API Reference}
 */
export type JSONAPIPaginationLinks = {
  [P in 'first' | 'prev' | 'next' | 'last']?: JSONAPILink | null
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-links|JSON:API Reference}
 */
export type JSONAPIResourceLinks = {
  [P in 'self']?: JSONAPILink
}

/**
 * {@link https://jsonapi.org/format/#error-objects|JSON:API Reference}
 */
export type JSONAPIErrorLinks = {
  [P in 'about']?: JSONAPILink
}

/**
 * {@link https://jsonapi.org/format/#error-objects|JSON:API Reference}
 */
export type JSONAPIErrorObject = {
  id?: string
  links?: JSONAPIErrorLinks
  status?: string
  code?: string
  title?: string
  detail?: string
  meta?: JSONAPIMetaObject
  source?: {
    pointer?: string
    parameter?: string
  }
}

/**
 * {@link https://jsonapi.org/format/#fetching|JSON:API Reference}
 */
export type JSONAPISearchParams = {
  page?: JSONAPIPageParams
  sort?: JSONAPISortParams
  filter?: JSONAPIFilterParams
}

/**
 * {@link https://jsonapi.org/format/#fetching-pagination|JSON:API Reference}
 */
export type JSONAPIPageParams =
  | string
  | number
  | {
      [name: string]: string | number | JSONAPIPageParams
    }

/**
 * {@link https://jsonapi.org/format/#fetching-sorting|JSON:API Reference}
 */
export type JSONAPISortParams = NonEmptyReadonlyArray<string>

/**
 * {@link https://jsonapi.org/format/#fetching-filtering|JSON:API Reference}
 */
export type JSONAPIFilterParams =
  | string
  | {
      [name: string]: Serializable
    }

/**
 * {@link https://jsonapi.org/faq/#wheres-put|JSON:API Reference}
 */
export type JSONAPIRequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// JSONAPIClient
namespace JSONAPIClient {
  export type IllegalField<V extends string, U> = TypeError & {
    message: V
    actual: U
  }
}
