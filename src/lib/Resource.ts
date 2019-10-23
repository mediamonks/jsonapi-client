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
    [K in ResourceFieldNames<R>]: ResourceRelationship<R[K]> extends never
      ? never
      : K
  }
>

export type ResourceRelationships<R extends AnyResource> = Pick<
  R,
  ResourceRelationshipNames<R>
>

export type ResourceAttributeNames<R extends AnyResource> = ExtendsOrNever<
  Exclude<keyof R, ResourceRelationshipNames<R> | ResourceIdentifierKey>,
  string
>

export type ResourceAttributes<R extends AnyResource> = Pick<
  R,
  ResourceAttributeNames<R>
>

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
    static fields: Record<ResourceType, ResourceField<any>> = Object.create(
      null,
    )
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

// class A extends resource('a')<A> {
//   b!: B | null
// }

// class B extends resource('b')<B> {
//   c!: C | null
// }

// class C extends resource('c')<C> {
//   d!: D | null
// }

// class D extends resource('d')<D> {
//   e!: E | null
// }

// class E extends resource('e')<E> {
//   f!: F | null
// }

// class F extends resource('f')<F> {
//   g!: G | null
// }

// class G extends resource('g')<G> {
//   a!: A | null
// }

// const a = new A({
//   type: 'a',
//   id: 'x',
//   b: null,
// })

// type Xaf = ResourceModels<A>

// type RT<T> = T extends AnyResource
//   ? {
//       [K in T['type']]: NonEmptyArray<
//         Exclude<keyof Extract<T, { type: K }>, ResourceIdentifierKey>
//       >
//     }
//   : never

// type Xo<T> = RT<ResourceModels<T>>

// type Xo2 = Xo<A>

// type ResourceModels<T, X = T> = T extends AnyResource
//   ?
//       | T
//       | ValuesOf<
//           {
//             [K in keyof T]: Exclude<T[K], null> extends AnyResource
//               ? Exclude<T[K], null> extends X
//                 ? never
//                 : ResourceModels<Exclude<T[K], null>, X | T>
//               : T[K] extends Array<AnyResource>
//               ? T[K][any] extends X
//                 ? never
//                 : ResourceModels<T[K][any], X | T>
//               : never
//           }
//         >
//   : never
// // TEMP
