import type {
  SerializableArray,
  SerializablePrimitive,
  SerializableObject,
  Intersect,
  Predicate,
  Nullable,
} from 'isntnt'
import { RelationshipFieldType, ResourceFieldFlag, ResourceFieldRule } from '../data/enum'
import { ResourceField } from '../resource/field'
import { AttributeField } from '../resource/field/attribute'
import { RelationshipField } from '../resource/field/relationship'
import { ResourceFormatter } from '../formatter'
import type {
  ResourceType,
  ResourceId,
  MetaObject,
  ResourceDocumentLinks,
  ResourceIdentifierObject,
} from './jsonapi'
import type { LINKS_ACCESSOR, META_ACCESSOR } from '../data/constants'
import { ResourceIdentifier } from '../resource/identifier'

// Util

type NonEmptyReadonlyArray<T> = ReadonlyArray<T> & { 0: T }

/** @hidden */
export type ReadonlyRecord<K extends keyof any, T> = {
  readonly [P in K]: T
}

// Resource
// export type ResourceType = string
// export type ResourceId = string

export type ResourcePath = string

export type ResourceIdentifierKey = 'type' | 'id'

type BaseResourceCreateData<T extends ResourceFormatter> = {
  type: T['type']
  id?: ResourceId
} & {
  [P in ResourceFieldNameWithFlag<
    T['fields'],
    ResourceFieldFlag.PostRequired
  >]: ResourceFieldCreateValue<T['fields'][P]>
} &
  {
    [P in ResourceFieldNameWithFlag<
      T['fields'],
      ResourceFieldFlag.PostOptional
    >]?: ResourceFieldCreateValue<T['fields'][P]>
  }

export type ResourceCreateData<T extends ResourceFormatter> = T extends ResourceFormatter<
  infer R,
  any
>
  ? {
      [P in R]: BaseResourceCreateData<Extract<T, { type: P }>>
    }[R]
  : never

type BaseResourcePatchData<T extends ResourceFormatter> = {
  type: T['type']
  id: ResourceId
} & Pick<
  {
    [P in keyof T['fields']]?: ResourceFieldPatchValue<T['fields'][P]>
  },
  ResourceFieldNameWithFlag<
    T['fields'],
    ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PatchRequired
  >
>

export type ResourcePatchData<T extends ResourceFormatter> = T extends ResourceFormatter<
  infer R,
  any
>
  ? {
      [P in R]: BaseResourcePatchData<Extract<T, { type: P }>>
    }[R]
  : never

type BaseNaiveIncludedResource<T extends ResourceFormatter> = ResourceIdentifierObject<T['type']> &
  {
    [P in ResourceFieldNameWithFlag<
      T['fields'],
      ReadableFieldFlag
    >]?: T['fields'][P] extends AttributeField<infer R, any, any>
      ? R
      : T['fields'][P] extends RelationshipField<infer R, infer S, any>
      ? S extends 'to-one'
        ? Nullable<ResourceIdentifierObject<R['type']>>
        : ReadonlyArray<ResourceIdentifierObject<R['type']>>
      : never
  }

export type NaiveIncludedResource<T extends ResourceFormatter> = {
  [P in T['type']]: BaseNaiveIncludedResource<Extract<T, { type: P }>>
}[T['type']]

type BaseNaiveResource<T extends ResourceFormatter<any, any>> = {
  type: T['type']
  id: ResourceId
} & {
  [P in ResourceFieldNameWithFlag<
    T['fields'],
    ReadableFieldFlag
  >]?: T['fields'][P] extends AttributeField<infer R, any, any>
    ? R
    : T['fields'][P] extends RelationshipField<infer R, infer S, any>
    ? S extends 'to-one'
      ? Nullable<ResourceIdentifierObject<R['type']>> | Nullable<NaiveResource<R>>
      : ReadonlyArray<ResourceIdentifierObject<R['type']>> | ReadonlyArray<NaiveResource<R>>
    : never
}

export type NaiveResource<T extends ResourceFormatter<any, any>> = {
  [P in T['type']]: BaseNaiveResource<Extract<T, { type: P }>>
}[T['type']]

//
export type ExperimentalResourceQuery<
  T extends ResourceFormatter,
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
  T extends ResourceFormatter
> = BaseResourceFieldsRelatedResources<T['fields'], never>

// ResourceFilter
export type ResourceFilter<T extends ResourceFormatter = any> = {
  fields?: ResourceFieldsQuery<T>
} & {
  include?: ResourceIncludeQuery<T>
}

// Query
export type ResourceQueryParams = ResourceFilter<any>

type BaseResourcesFieldsQuery<T> = T extends ResourceFormatter
  ? {
      [P in T['type']]?: NonEmptyReadonlyArray<
        ResourceFieldNameWithFlag<
          Extract<T, { type: P }>['fields'],
          ResourceFieldFlag.GetRequired | ResourceFieldFlag.GetOptional
        >
      >
    }
  : never

export type ResourceFieldsQuery<T extends ResourceFormatter = any> = Intersect<
  BaseResourcesFieldsQuery<ResourceRelatedResources<T>>
>

export type ResourceIncludeQuery<T extends ResourceFormatter = any> = {
  [P in keyof T['fields']]?: T['fields'][P] extends RelationshipField<
    any,
    any,
    ResourceFieldFlag.GetForbidden
  >
    ? never
    : T['fields'][P] extends RelationshipField<infer R, any, any>
    ? Nullable<ResourceIncludeQuery<R>>
    : never
}

// Fields
export type ResourceFields = Record<
  string,
  AttributeField<any, any, any> | RelationshipField<any, any, any>
>

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

export type ResourceFieldNameWithFlag<
  T extends ResourceFields,
  U extends ResourceFieldFlag
> = Extract<
  {
    [P in keyof T]: T[P] extends ResourceField<any, infer R> ? (R extends U ? P : never) : never
  }[keyof T],
  string
>

export type ResourceFieldFactoryRules = [
  get: ResourceFieldRule,
  post: ResourceFieldRule,
  patch: ResourceFieldRule,
]

export type ResourceFieldGetMask =
  | ResourceFieldFlag.GetForbidden
  | ResourceFieldFlag.GetOptional
  | ResourceFieldFlag.GetRequired

export type ResourceFieldPostMask =
  | ResourceFieldFlag.PostForbidden
  | ResourceFieldFlag.PostOptional
  | ResourceFieldFlag.PostRequired

export type ResourceFieldPatchMask =
  | ResourceFieldFlag.PatchForbidden
  | ResourceFieldFlag.PatchOptional
  | ResourceFieldFlag.PatchRequired

export type ResourceFieldNeverMask =
  | ResourceFieldFlag.GetForbidden
  | ResourceFieldFlag.PostForbidden
  | ResourceFieldFlag.PatchForbidden

export type ResourceFieldMaybeMask =
  | ResourceFieldFlag.GetOptional
  | ResourceFieldFlag.PostOptional
  | ResourceFieldFlag.PatchOptional

export type ResourceFieldAlwaysMask =
  | ResourceFieldFlag.GetRequired
  | ResourceFieldFlag.PostRequired
  | ResourceFieldFlag.PatchRequired

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
  ? S extends WritableFieldFlag
    ? R | (S extends ResourceFieldFlag.PostOptional ? null : never)
    : never
  : never

export type AttributeFieldPatchValue<
  T extends AttributeField<any, any, any>
> = T extends AttributeField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.PatchOptional
    ? Nullable<R>
    : S extends ResourceFieldFlag.PatchRequired
    ? R
    : never
  : never

export type AttributeFieldName<T extends ResourceFormatter<any, any>> = Extract<
  {
    [P in keyof T['fields']]: T['fields'][P] extends AttributeField<any, any, any> ? P : never
  }[keyof T['fields']],
  ResourceFieldName
>

export type AttributeFieldNameWithFlag<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldFlag
> = ResourceFieldNameWithFlag<Pick<T['fields'], AttributeFieldName<T>>, U>

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
export type RelationshipCreateData<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<any, infer R, infer S>
  ? R extends RelationshipFieldType.ToOne
    ? ToOneRelationshipCreateData<T> | (S extends ResourceFieldFlag.PostOptional ? null : never)
    : R extends RelationshipFieldType.ToMany
    ? ToManyRelationshipCreateData<T>
    : never
  : never

export type ToOneRelationshipCreateData<
  T extends RelationshipField<any, RelationshipFieldType.ToOne, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.PostOptional | ResourceFieldFlag.PostRequired
    ? ResourceIdentifier<R['type']>
    : never
  : never

export type ToManyRelationshipCreateData<
  T extends RelationshipField<any, RelationshipFieldType.ToMany, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PatchRequired
    ? ReadonlyArray<ResourceIdentifier<R['type']>>
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
  ? S extends ResourceFieldFlag.PatchOptional
    ? Nullable<ResourceIdentifier<R['type']>>
    : S extends ResourceFieldFlag.PatchRequired
    ? ResourceIdentifier<R['type']>
    : never
  : never

export type ToManyRelationshipPatchData<
  T extends RelationshipField<any, RelationshipFieldType.ToMany, any>
> = T extends RelationshipField<infer R, any, infer S>
  ? S extends ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PatchRequired
    ? ReadonlyArray<ResourceIdentifier<R['type']>>
    : never
  : never

export type RelationshipFieldResourceFormatter<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<infer R, any, any> ? R : never

export type RelationshipFieldResourceIdentifier<
  T extends RelationshipField<any, any, any>
> = T extends RelationshipField<infer R, any, any>
  ? Nullable<
      {
        [P in R['type']]: ResourceIdentifierObject<P>
      }[R['type']]
    >
  : never

export type RelationshipFieldName<T extends ResourceFormatter<any, any>> = Extract<
  {
    [P in keyof T['fields']]: T['fields'][P] extends RelationshipField<any, any, any> ? P : never
  }[keyof T['fields']],
  ResourceFieldName
>

export type RelationshipFieldNameWithFlag<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldFlag
> = ResourceFieldNameWithFlag<Pick<T['fields'], RelationshipFieldName<T>>, U>

export type ToOneRelationshipFieldName<T extends ResourceFormatter<any, any>> = {
  [P in keyof T['fields']]: T['fields'][P] extends RelationshipField<any, infer R, any>
    ? R extends RelationshipFieldType.ToOne
      ? P
      : never
    : never
}[keyof T['fields']]

export type ToOneRelationshipFieldNameWithFlag<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldFlag = any
> = ResourceFieldNameWithFlag<Pick<T['fields'], ToOneRelationshipFieldName<T>>, U>

export type ToManyRelationshipFieldName<T extends ResourceFormatter<any, any>> = {
  [P in keyof T['fields']]: T['fields'][P] extends RelationshipField<any, infer R, any>
    ? R extends RelationshipFieldType.ToMany
      ? P
      : never
    : never
}[keyof T['fields']]

export type ToManyRelationshipFieldNameWithFlag<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldFlag
> = ResourceFieldNameWithFlag<Pick<T['fields'], ToManyRelationshipFieldName<T>>, U>

export type RelationshipFieldFactory = (
  getFormatter: () => ResourceFormatter,
) => RelationshipField<any, RelationshipFieldType, any>

export type ToOneRelationshipFieldFromFactory<
  T extends ResourceFormatter,
  U extends RelationshipFieldFactory
> = ReturnType<U> extends RelationshipField<any, any, infer R>
  ? RelationshipField<T, RelationshipFieldType.ToOne, R>
  : never

export type ToManyRelationshipFieldFromFactory<
  T extends ResourceFormatter,
  U extends RelationshipFieldFactory
> = ReturnType<U> extends RelationshipField<any, any, infer R>
  ? RelationshipField<T, RelationshipFieldType.ToMany, R>
  : never

// JSONAPI

// Experimental
type ReadableFieldFlag = ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
type WritableFieldFlag = ResourceFieldFlag.PostOptional | ResourceFieldFlag.PostRequired

type BaseResourceFieldNameOfFlag<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldFlag
> = {
  [P in keyof T['fields']]: T['fields'][P] extends ResourceField<any, infer R>
    ? R extends U
      ? P
      : never
    : never
}[keyof T['fields']]

export type ResourceFieldName<
  T extends ResourceFormatter<any, any> = any,
  U extends ResourceFieldFlag = any
> = Extract<
  {
    [P in T['type']]: BaseResourceFieldNameOfFlag<Extract<T, { type: P }>, U>
  }[T['type']],
  string
>

export type ReadableResourceFieldName<T extends ResourceFormatter<any, any>> = ResourceFieldName<
  T,
  ReadableFieldFlag
>

type ResourceFieldsFilterValue<T extends ResourceFormatter<any, any>> = {
  [P in T['type']]?: ReadonlyArray<ReadableResourceFieldName<T>>
}

type BaseResourceFieldsFilterLimited<R extends ResourceFormatter<any, any>> =
  | ResourceFieldsFilterValue<R>
  | {
      [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
        ?
            | ResourceFieldsFilterValue<R>
            | {
                [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<
                  infer R,
                  any,
                  any
                >
                  ?
                      | ResourceFieldsFilterValue<R>
                      | {
                          [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<
                            infer R,
                            any,
                            any
                          >
                            ?
                                | ResourceFieldsFilterValue<R>
                                | {
                                    [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<
                                      infer R,
                                      any,
                                      any
                                    >
                                      ?
                                          | ResourceFieldsFilterValue<R>
                                          | {
                                              [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<
                                                infer R,
                                                any,
                                                any
                                              >
                                                ?
                                                    | ResourceFieldsFilterValue<R>
                                                    | {
                                                        [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<
                                                          infer R,
                                                          any,
                                                          any
                                                        >
                                                          ? ResourceFieldsFilterValue<R>
                                                          : never
                                                      }[keyof R['fields']]
                                                : never
                                            }[keyof R['fields']]
                                      : never
                                  }[keyof R['fields']]
                            : never
                        }[keyof R['fields']]
                  : never
              }[keyof R['fields']]
        : never
    }[keyof R['fields']]

export type ResourceFieldsFilterLimited<T extends ResourceFormatter<any, any>> = Intersect<
  BaseResourceFieldsFilterLimited<T>
>

type BaseResourceIncludeFilter<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldsFilterLimited<T>,
  V extends keyof T['fields']
> = {
  [P in keyof T['fields']]?: P extends V
    ? T['fields'][P] extends RelationshipField<infer R, any, infer S>
      ? S extends ReadableFieldFlag
        ? ResourceIncludeFilter<R, U>
        : never
      : never
    : never
}

export type ResourceIncludeFilter<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldsFilterLimited<T> = any
> = Nullable<
  {
    [P in T['type']]: BaseResourceIncludeFilter<
      Extract<T, { type: P }>,
      U,
      P extends keyof U ? U[P][number] : keyof T['fields']
    >
  }[T['type']]
>

type BaseFilteredResource<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFieldsFilterLimited<T> | undefined,
  V
> = { type: T['type']; id: string } & {
  [P in T['type'] extends keyof U
    ? U[T['type']][number]
    : ReadableResourceFieldName<T>]: T['fields'][P] extends AttributeField<infer R, any, infer S>
    ? R | (Extract<S, ResourceFieldFlag.GetRequired> extends never ? null : never)
    : T['fields'][P] extends RelationshipField<infer R, RelationshipFieldType.ToOne, infer S>
    ?
        | (P extends keyof V
            ? V[P] extends ResourceIncludeFilter<R, any>
              ? Resource<R, { fields: U; include: V[P] }>
              : Resource<R, { fields: U; include: null }>
            : { type: R['type']; id: string })
        | (Extract<S, ResourceFieldFlag.GetRequired> extends never ? null : never)
    : T['fields'][P] extends RelationshipField<infer R, RelationshipFieldType.ToMany, any>
    ? ReadonlyArray<
        P extends keyof V
          ? V[P] extends ResourceIncludeFilter<R, any>
            ? Resource<R, { fields: U; include: V[P] }>
            : Resource<R, { fields: U; include: null }>
          : { type: R['type']; id: string }
      >
    : never
}

export type WithMeta<T extends NaiveResource<any> | ReadonlyArray<NaiveResource<any>>> = T & {
  [META_ACCESSOR]: MetaObject | null
  [LINKS_ACCESSOR]: ResourceDocumentLinks | null
}

export type Resource<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFilterLimited<T> = {}
> = {
  [P in T['type']]: BaseFilteredResource<Extract<T, { type: P }>, U['fields'], U['include']>
}[T['type']]

export interface ResourceFilterLimited<T extends ResourceFormatter<any, any>> {
  fields?: ResourceFieldsFilterLimited<T>
  include?: ResourceIncludeFilter<T, any>
}

export type OneResourceDocument<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFilterLimited<T>
> = WithMeta<Resource<T, U>>

export type ManyResourceDocument<
  T extends ResourceFormatter<any, any>,
  U extends ResourceFilterLimited<T>
> = WithMeta<ReadonlyArray<Resource<T, U>>>

export type ResourceFieldsFilter<
  Formatter extends ResourceFormatter<any, any>
> = BaseResourceFieldsFilter<FlatIncludedResourceFormatters<Formatter>>

type BaseResourceFieldsFilter<Formatter extends ResourceFormatter<any, any>> = {
  [Type in Formatter['type']]?: ReadonlyArray<
    keyof Extract<Formatter, { type: Type }>['fields']
    // ReadableResourceFieldName<Extract<Formatter, { type: Type }>>
  >
}

export type FlatIncludedResourceFormatters<Formatter extends ResourceFormatter<any, any>> = {
  [Type in Formatter['type']]: BaseFlatIncludedResourceFormatters<
    Extract<Formatter, { type: Type }>,
    never
  >
}[Formatter['type']]

type BaseFlatIncludedResourceFormatters<
  Formatter extends ResourceFormatter<any, any>,
  ProcessedResourceType
> = Formatter['type'] extends ProcessedResourceType
  ? never
  :
      | Formatter
      | {
          [FieldName in keyof Formatter['fields']]: Formatter['fields'][FieldName] extends RelationshipField<
            infer RelatedFormatter,
            any,
            any
          >
            ? BaseFlatIncludedResourceFormatters<
                RelatedFormatter,
                ProcessedResourceType | Formatter['type']
              >
            : never
        }[keyof Formatter['fields']]