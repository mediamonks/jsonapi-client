import { Intersect } from 'isntnt'

import { ValuesOf, ExtendsOrNever, NonEmptyReadonlyArray, Nullable } from '../types/util'

import { ResourceFields, ResourceField } from './ResourceField'
import { ResourceIdentifier, ResourceIdentifierKey } from './ResourceIdentifier'
import { RelationshipValue, AttributeValue } from './ResourceField'

export type ResourceType = string
export type ResourceId = string

export type AnyResource = ResourceIdentifier<ResourceType>

type ResourceFieldsModel<F extends ResourceFields<any>> = {
  [K in keyof F]: K extends ResourceIdentifierKey
    ? never
    : F[K] extends RelationshipValue
    ? F[K]
    : F[K] extends AttributeValue | null
    ? F[K]
    : never
}

export const resource = <T extends ResourceType>(type: T) => {
  return class JSONAPIResource<
    M extends ResourceFieldsModel<Omit<M, ResourceIdentifierKey>>
  > extends ResourceIdentifier<T> {
    static type: T = type
    static fields: Record<ResourceType, ResourceField<any, any>> = Object.create(null)
    constructor(data: ResourceIdentifier<T> & M) {
      super(data.type, data.id)
      Object.assign(this, data)
    }
  }
}

export type ResourceFieldNames<R extends AnyResource> = ExtendsOrNever<
  Exclude<keyof R, ResourceIdentifierKey>,
  string
>

export type ResourceToOneRelationshipName<R extends AnyResource> = ValuesOf<
  {
    [K in ResourceFieldNames<R>]: R[K] extends AnyResource | null ? K : never
  }
>

export type ResourceToManyRelationshipName<R extends AnyResource> = ValuesOf<
  {
    [K in ResourceFieldNames<R>]: R[K] extends AnyResource[] ? K : never
  }
>

export type ResourceConstructor<R extends AnyResource> = {
  type: R['type']
  fields: Record<ResourceType, ResourceField<any, any>>
  new (data: R): R
}

export type ResourceCreateValues<R extends AnyResource> = Partial<ResourceIdentifier<R['type']>> &
  {
    [K in Exclude<keyof R, ResourceIdentifierKey>]: R[K] extends AnyResource[]
      ? ResourceIdentifier<R[K][number]['type']>[]
      : Exclude<R[K], null> extends AnyResource
      ? ResourceIdentifier<Extract<R[K], AnyResource>['type']> | null
      : R[K]
  }

export type ResourcePatchValues<R extends AnyResource> = Partial<ResourceCreateValues<R>>

// NEW!
// Extract the Resource from a relationship field value
type BaseRelationshipResource<R> = R extends AnyResource | null
  ? Extract<R, AnyResource>
  : R extends Array<AnyResource>
  ? Extract<R[number], AnyResource>
  : never

// Extract the relationship field names from a Resource
type BaseResourceRelationshipFields<R> = {
  [K in keyof R]: R[K] extends AnyResource | null | AnyResource[] ? K : never
}[keyof R]

// Pick the Resources from the relationship fields of a resource
type BaseResourceRelationships<R> = {
  [K in BaseResourceRelationshipFields<R>]: BaseRelationshipResource<R[K]>
}

// RESOURCE FIELDS PARAMETER
type BaseResourceFields<R> = R extends AnyResource
  ? {
      [T in R['type']]?: NonEmptyReadonlyArray<keyof R>
    } &
      {
        [K in keyof R]: BaseResourceFields<BaseRelationshipResource<R[K]>>
      }[keyof R]
  : {}

type ProcessResourceFields<F> = Partial<
  Intersect<
    {
      [K in keyof F]: Extract<string, K> extends never ? F[K] : NonEmptyReadonlyArray<string>
    }
  >
>

export type ResourceFieldsParameter<R extends AnyResource> = ProcessResourceFields<
  BaseResourceFields<R>
>

// RESOURCE INCLUDE PARAMETER
type BaseExtractResourceIncludes<R> = keyof R extends never
  ? never
  : {
      [K in keyof R]?: BaseResourceIncludes<
        R[K] extends AnyResource[] ? R[K][number] : Extract<R[K], AnyResource>
      >
    }

type BaseResourceIncludes<R> = Nullable<BaseExtractResourceIncludes<BaseResourceRelationships<R>>>

export type ResourceIncludeParameter<R extends AnyResource> = BaseResourceIncludes<R>

// FILTERED RESOURCE
type BaseGatherFieldsFromResource<R, K, F, I> = R extends { type: string }
  ? K extends keyof R
    ? {
        [P in K]: R[K] extends AnyResource | null
          ? Nullable<
              K extends keyof I
                ? BaseFilteredResource<Extract<R[K], AnyResource>, F, I[K]>
                : ResourceIdentifier<R['type']>
            >
          : R[K] extends AnyResource[]
          ? Array<
              K extends keyof I
                ? BaseFilteredResource<R[K][any], F, I[K]>
                : ResourceIdentifier<R['type']>
            >
          : R[K]
      }
    : never
  : never

type BaseFilteredResourceOfType<R, T, F, I> = T extends keyof F
  ? ProcessFilteredResource<
      BaseGatherFieldsFromResource<R, F[T][any] | ResourceIdentifierKey, F, I>
    >
  : ProcessFilteredResource<BaseGatherFieldsFromResource<R, keyof R, F, I>>

type BaseFilteredResource<R, F, I> = R extends { type: string }
  ? ProcessFilteredResource<BaseFilteredResourceOfType<R, R['type'], F, I>>
  : never

type ProcessFilteredResource<T> = Intersect<
  {
    [K in keyof T]: T[K]
  }
>

export type FilteredResource<
  R extends AnyResource,
  F extends ResourceParameters<R>
> = BaseFilteredResource<R, F['fields'], F['include']>

export type ResourceParameters<R extends AnyResource> = {
  fields?: ResourceFieldsParameter<R>
  include?: BaseResourceIncludes<R>
}
