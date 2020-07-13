import {
  SerializableArray,
  SerializablePrimitive,
  SerializableObject,
  Intersect,
  Predicate,
  Serializable,
} from 'isntnt'

import ResourceField, {
  AttributeField,
  RelationshipField,
  RelationshipFieldType,
  ResourceFieldFlag,
  ResourceFieldRule,
} from './resource/field'

// Util
type NonEmptyReadonlyArray<T> = ReadonlyArray<T> & { 0: T }

// Resource
export type ResourceType = string
export type ResourceId = string

export type ResourcePath = string

export type ResourceIdentifier<T extends ResourceType> = {
  type: T
  id: ResourceId
}

export type ResourceIdentifierKey = keyof ResourceIdentifier<any>

export type Resource<T extends ResourceConstructor<any, any>> = ResourceIdentifier<T['type']> &
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
  T extends ResourceConstructor<any, any>,
  U extends ResourceQueryParams<T>
> = T['type'] extends keyof U['fields'] ? U['fields'][T['type']][number] : keyof T['fields']

export type FilteredResource<
  T extends ResourceConstructor<any, any>,
  U extends ResourceQueryParams<T> = {}
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
  ResourceConstructor<T, U>
>

export type ResourceCreateData<T extends ResourceConstructor<any, any>> = Partial<
  ResourceIdentifier<T['type']>
> &
  {
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
    [P in ResourceFieldNameWithFlag<T['fields'], ResourceFieldFlag.NeverPost>]?: never
    // JSONAPIClient.IllegalField<
    //   'Field with NeverPost flag must be omitted from ResourceCreateData',
    //   T['fields'][P]
    // >
  }

export type ResourcePatchData<T extends ResourceConstructor<any, any>> = {
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
    [P in ResourceFieldNameWithFlag<T['fields'], ResourceFieldFlag.NeverPatch>]?: never
    // JSONAPIClient.IllegalField<
    //   'Field with NeverPatch flag must be omitted from ResourcePatchData',
    //   T['fields'][P]
    // >
  }

// Constructor
export type ResourceConstructor<T extends ResourceType, U extends ResourceFields> = {
  new (data: ResourceConstructorData<T, U>): Resource<ResourceConstructor<T, U>>
  type: T
  path: ResourcePath
  fields: U
  identifier(id: ResourceId): ResourceIdentifier<T>
  parseResourceDocument(
    resourceDocument: JSONAPIDocument<ResourceConstructor<T, U>>,
  ): Resource<ResourceConstructor<T, U>>
  encode(resource: Resource<ResourceConstructor<T, U>>): JSONAPIDocument<ResourceConstructor<T, U>>
  createFilter<
    V extends ResourceFieldsQuery<ResourceConstructor<T, U>>,
    W extends ResourceIncludeQuery<ResourceConstructor<T, U>, V>
  >(
    fields?: V,
    include?: W,
  ): { fields: V; include: W }
  createResourcePostObject<V extends ResourceCreateData<ResourceConstructor<T, U>>>(
    data: V,
  ): JSONAPIResourceObject<ResourceConstructor<T, U>>
  createResourcePatchObject<V extends ResourcePatchData<ResourceConstructor<T, U>>>(
    id: ResourceId,
    data: V,
  ): JSONAPIResourceObject<ResourceConstructor<T, U>>
}

export type ExperimentalResourceQuery<
  T extends ResourceConstructor<any, any>,
  U extends ResourceFieldsQuery<T>,
  V extends ResourceIncludeQuery<T, U>
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

type BaseResourceRelatedResources<T, U extends ResourceType> = T extends ResourceConstructor<
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
  T extends ResourceConstructor<any, any>
> = BaseResourceFieldsRelatedResources<T['fields'], never>

// Query
export type ResourceQueryParams<T extends ResourceConstructor<any, any>> = {
  [P in 'fields']?: ResourceFieldsQuery<T>
} &
  {
    [P in 'include']?: ResourceIncludeQuery<T>
  }

type BaseResourcesFieldsQuery<T> = T extends ResourceConstructor<any, any>
  ? {
      [P in T['type']]?: NonEmptyReadonlyArray<
        ResourceFieldNameWithFlag<
          Extract<T, { type: P }>['fields'],
          ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.MaybeGet
        >
      >
    }
  : never

export type ResourceFieldsQuery<T extends ResourceConstructor<any, any>> = Intersect<
  BaseResourcesFieldsQuery<ResourceRelatedResources<T>>
>

export type ResourceIncludeQuery<
  T extends ResourceConstructor<any, any>,
  U extends ResourceFieldsQuery<T> | {} = {}
> = {
  [P in keyof T['fields']]?: T['fields'][P] extends RelationshipField<
    any,
    any,
    ResourceFieldFlag.NeverGet
  >
    ? never // JSONAPIClient.IllegalField< //     'Field with NeverGet flag must be omitted from ResourceIncludeQuery', //     T[P] //   >
    : T['fields'][P] extends RelationshipField<infer R, any, any>
    ? T['type'] extends keyof U
      ? P extends U[T['type']][number]
        ? ResourceIncludeQuery<R, U> | null
        : never // JSONAPIClient.IllegalField< //     'Field must be present in ResourceIncludeQuery', //     { [P in T['type']]: U[T['type']] } //   >
      : ResourceIncludeQuery<R, U> | null
    : never //JSONAPIClient.IllegalField<'Field must be a RelationshipField', T['fields'][P]>
}

// Fields
export type ResourceFields = {
  [name: string]: ResourceField<any, any>
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

export type AttributeFieldFactory = (predicate: Predicate<any>) => AttributeField<any, any, any>

export type AttributeFieldFromFactory<
  T extends AttributeValue,
  U,
  V extends AttributeFieldFactory
> = ReturnType<V> extends AttributeField<any, any, infer R> ? AttributeField<U, T, R> : never

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
> = T extends RelationshipField<infer R, RelationshipFieldType.ToOne, any>
  ?
      | {
          [P in R['type']]: ResourceIdentifier<P>
        }[R['type']]
      | null
  : T extends RelationshipField<infer R, RelationshipFieldType.ToMany, any>
  ? Array<
      {
        [P in R['type']]: ResourceIdentifier<P>
      }[R['type']]
    >
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
  getResources: () => Array<ResourceConstructor<any, any>>,
) => RelationshipField<any, RelationshipFieldType, any>

export type ToOneRelationshipFieldFromFactory<
  T extends ResourceConstructor<any, any>,
  U extends RelationshipFieldFactory
> = ReturnType<U> extends RelationshipField<any, any, infer R>
  ? RelationshipField<T, RelationshipFieldType.ToOne, R>
  : never

export type ToManyRelationshipFieldFromFactory<
  T extends ResourceConstructor<any, any>,
  U extends RelationshipFieldFactory
> = ReturnType<U> extends RelationshipField<any, any, infer R>
  ? RelationshipField<T, RelationshipFieldType.ToMany, R>
  : never

// ToOne Relationship

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
  T extends ResourceConstructor<any, any> | Array<ResourceConstructor<any, any>>
> = (
  | ((
      | {
          // data and errors are mutually exclusive
          data: JSONAPIResourceObject<
            T extends ResourceConstructor<any, any>
              ? T
              : T extends Array<ResourceConstructor<any, any>>
              ? T[number]
              : never
          >
          errors?: never
        }
      | {
          data?: never
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
  included?: Array<
    JSONAPIResourceObject<
      ResourceRelatedResources<
        T extends ResourceConstructor<any, any>
          ? T
          : T extends Array<ResourceConstructor<any, any>>
          ? T[number]
          : never
      >
    >
  >
}

/**
 * {@link https://jsonapi.org/format/#document-resource-objects|JSON:API Reference}
 */
export type JSONAPIResourceObject<T extends ResourceConstructor<any, any>> = ResourceIdentifier<
  T['type']
> & {
  attributes?: JSONAPIResourceObjectAttributes<T['fields']>
  relationships?: JSONAPIResourceObjectRelationships<T['fields']>
  links?: JSONAPILinksObject
  meta?: JSONAPIMetaObject
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-attributes|JSON:API Reference}
 */
export type JSONAPIResourceObjectAttributes<U extends ResourceFields> = {
  [P in AttributeFieldName<U>]?: RawAttributeFieldValue<U[P]>
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-relationships|JSON:API Reference}
 */
export type JSONAPIResourceObjectRelationships<U extends ResourceFields> = {
  [P in RelationshipFieldName<U>]?: {
    data?: RelationshipFieldResourceIdentifier<U[P]>
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
export type JSONAPILinksObject = {
  [key: string]:
    | string
    | {
        href?: string
        meta?: JSONAPIMetaObject
      }
}

/**
 * {@link https://jsonapi.org/format/#fetching-pagination|JSON:API Reference}
 */
export type JSONAPIPaginationLinks = {
  pagination?: {
    [P in 'first' | 'prev' | 'next' | 'last']?: string | null
  }
}

/**
 * {@link https://jsonapi.org/format/#document-resource-object-links|JSON:API Reference}
 */
export type JSONAPIResourceLinks = {
  [P in 'self' | 'related']?:
    | string
    | {
        href?: string
        meta?: JSONAPIMetaObject
      }
}

/**
 * {@link https://jsonapi.org/format/#error-objects|JSON:API Reference}
 */
export type JSONAPIErrorLinks = {
  [P in 'about']?:
    | string
    | {
        href?: string
        meta?: JSONAPIMetaObject
      }
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
  source: {
    pointer?: string
    parameter?: string
  }
}

export type JSONAPISearchParams = {
  page?: JSONAPIPageParams
  sort?: JSONAPISortParams
  filter?: JSONAPIFilterParams
}

export type JSONAPIPageParams = {
  [name: string]: string | number | JSONAPIPageParams
}

export type JSONAPISortParams = NonEmptyReadonlyArray<string>

export type JSONAPIFilterParams = {
  [name: string]: Serializable
}

export type JSONAPIRequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// JSONAPIClient
namespace JSONAPIClient {
  export type IllegalField<V extends string, U> = TypeError & {
    message: V
    actual: U
  }
}
