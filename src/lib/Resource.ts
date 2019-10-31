import { ValuesOf, ExtendsOrNever } from '../types/util'
import { ResourceFields, ResourceField } from './ResourceField'
import { ResourceIdentifier, ResourceIdentifierKey } from './ResourceIdentifier'
import { RelationshipValue } from './ResourceRelationship'
import { AttributeValue } from './ResourceAttribute'

export type ResourceType = string
export type ResourceId = string

export type AnyResource = ResourceIdentifier<ResourceType>

export type ResourceFieldNames<R extends AnyResource> = ExtendsOrNever<
  Exclude<keyof R, ResourceIdentifierKey>,
  string
>

export type ResourceRelationshipNames<R extends AnyResource> = ValuesOf<
  {
    [K in ResourceFieldNames<R>]: ResourceRelationship<R[K]> extends never ? never : K
  }
>

export type ResourceRelationships<R extends AnyResource> = Pick<R, ResourceRelationshipNames<R>>

export type ResourceAttributeNames<R extends AnyResource> = ExtendsOrNever<
  Exclude<keyof R, ResourceRelationshipNames<R> | ResourceIdentifierKey>,
  string
>

export type ResourceAttributes<R extends AnyResource> = Pick<R, ResourceAttributeNames<R>>

type ResourceFieldsModel<F extends ResourceFields<any>> = {
  [K in keyof F]: K extends ResourceIdentifierKey
    ? never
    : F[K] extends RelationshipValue<AnyResource>
    ? F[K]
    : F[K] extends AttributeValue
    ? F[K]
    : never
}

export type ResourceRelationship<T> = null extends T
  ? T extends AnyResource
    ? Extract<T, AnyResource>
    : never
  : T extends Array<AnyResource>
  ? T[number]
  : never

export const resource = <T extends ResourceType>(type: T) => {
  return class Resource<
    M extends ResourceFieldsModel<Omit<M, ResourceIdentifierKey>>
  > extends ResourceIdentifier<T> {
    static type: T = type
    static fields: Record<ResourceType, ResourceField<any>> = Object.create(null)
    constructor(data: ResourceIdentifier<T> & M) {
      super(data.type, data.id)
      Object.assign(this, data)
    }
  }
}

export type ResourceConstructor<R extends AnyResource> = {
  type: R['type']
  fields: Record<ResourceType, ResourceField<any>>
  new (data: R): R
}

export type ResourceCreateValues<R extends AnyResource> = ResourceIdentifier<R['type']> &
  {
    [K in Exclude<keyof R, ResourceIdentifierKey>]: R[K] extends AnyResource[]
      ? ResourceIdentifier<R[K][number]['type']>[]
      : Exclude<R[K], null> extends AnyResource
      ? ResourceIdentifier<Extract<R[K], AnyResource>['type']> | null
      : R[K]
  }

export type ResourcePatchValues<R extends AnyResource> = Partial<ResourceCreateValues<R>>
