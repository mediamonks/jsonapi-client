import {
  Predicate,
  Static,
  Some,
  None,
  shape,
  literal,
  isString,
  isNull,
  isObject,
  or,
  array,
  either,
} from 'isntnt'
import { isUndefined } from 'util'
import { createEmptyObject } from './src/utils/data'

const ok = <T>(value: T) => OKResult.of(value)
const error = <E extends Error | PropertyKey>(error: E) => ErrorResult.of(error)

// UTIL-TYPES
type Nullable<T> = T | null
type ValuesOf<T> = T[keyof T]

type WithoutNever<T> = Pick<
  T,
  ValuesOf<
    {
      [K in keyof T]: T[K] extends never ? never : K
    }
  >
>

// See https://github.com/Microsoft/TypeScript/issues/29594#issuecomment-507673155
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((
  k: infer I,
) => void)
  ? I
  : never

type NonEmptyArray<T> = Array<T> & { 0: T }
type ReadonlyNonEmptyArray<T> = ReadonlyArray<T> & { 0: T }

// CONSTANTS
const EMPTY_ARRAY: Array<any> = Object.freeze([]) as any
const TO_ONE_RELATIONSHIP_IDENTITY = null
const TO_MANY_RELATIONSHIP_IDENTITY = EMPTY_ARRAY

const ID = 'id'
const TYPE = 'type'

const ATTRIBUTES = 'attributes'
const RELATIONSHIPS = 'relationships'
const DATA = 'data'

const OPTIONAL = 'optional'
const REQUIRED = 'required'

const TO_ONE = 'to-one'
const TO_MANY = 'to-many'

const FIELDS = 'fields'
const INCLUDE = 'include'

const resourceFieldRoot = {
  ATTRIBUTES,
  RELATIONSHIPS,
} as const

const resourceAttributeFieldMeta = {
  OPTIONAL,
  REQUIRED,
} as const

const resourceRelationshipFieldMeta = {
  TO_ONE,
  TO_MANY,
} as const

const resourceFieldMeta = {
  [resourceFieldRoot.ATTRIBUTES]: resourceAttributeFieldMeta,
  [resourceFieldRoot.RELATIONSHIPS]: resourceRelationshipFieldMeta,
} as const

// PREDICATES
const isResourceIdentifierOfTypeFactory = <T extends ResourceType>(type: T) =>
  shape({
    type: literal(type),
    id: isString,
  })

const isResourceIdentifierKey = either(TYPE, ID)
const isResourceFieldDataRoot = either(ATTRIBUTES, RELATIONSHIPS)
const isResourceAttributesFieldMeta = either(OPTIONAL, REQUIRED)
const isResourceRelationshipFieldMeta = either(TO_ONE, TO_MANY)

const isDataObject = shape({
  [DATA]: isObject,
})

const createRulesValidator = (label: string, rules: Array<[Predicate<any>, string]>) => <T>(
  value: T,
): T => {
  rules.forEach(([predicate, description]) => {
    if (!predicate(value)) {
      throw new Error(`Invalid ${label}, value must ${description}`)
    }
  })
  return value
}

const not = <P extends Predicate<any>>(predicate: P) => (
  value: unknown,
): value is Exclude<Some | None, Static<P>> => !predicate(value)

const notResourceIdentifierKey = not(isResourceIdentifierKey)

const validateFieldName = createRulesValidator('field name', [
  [isString, 'be a string'],
  [notResourceIdentifierKey, `not be a resource identifier key (${TYPE} or ${ID})`],
])

// DATA-TYPES
type Serializable = SerializablePrimitive | SerializableArray | SerializableObject
type SerializablePrimitive = string | number | boolean | null
type SerializableArray = Array<Serializable>
type SerializableObject = {
  [key: string]: Serializable
}

// RESOURCE FIELD
export type ResourceFieldRoot = ValuesOf<typeof resourceFieldRoot>
export type ResourceAttributesFieldRoot = typeof resourceFieldRoot.ATTRIBUTES
export type ResourceRelationshipsFieldRoot = typeof resourceFieldRoot.RELATIONSHIPS

export type ResourceFieldMeta = typeof resourceFieldMeta
export type ResourceAttributeFieldMeta = ValuesOf<typeof resourceAttributeFieldMeta>
export type ResourceOptionalAttributeFieldMeta = typeof resourceAttributeFieldMeta['OPTIONAL']
export type ResourceRequiredAttributeFieldMeta = typeof resourceAttributeFieldMeta['REQUIRED']
export type ResourceRelationshipFieldMeta = ValuesOf<typeof resourceRelationshipFieldMeta>
export type ResourceToOneRelationshipFieldMeta = typeof resourceRelationshipFieldMeta['TO_ONE']
export type ResourceToManyRelationshipFieldMeta = typeof resourceRelationshipFieldMeta['TO_MANY']

export type ResourceFieldName = string
export type ResourceFieldValue = AttributeValue | RelationshipValue
export type ResourceFieldPredicate = Predicate<ResourceFieldValue>

export type AttributeValue =
  | SerializablePrimitive
  | SerializableArray
  | (SerializableObject & {
      relationships?: never
      fields?: never
    })

export type RelationshipValue = AnyResourceIdentifier | Nullable<Array<AnyResourceIdentifier>>

// RESOURCE FIELD
type ResourceFieldPointer<R extends ResourceFieldRoot, N extends ResourceFieldName> = [
  typeof DATA,
  R,
  N,
]

export type AttributeResourceField = ResourceField<
  ResourceAttributesFieldRoot,
  ResourceAttributeFieldMeta,
  ResourceFieldName,
  AttributeValue
>

export type OptionalAttributeResourceField = ResourceField<
  ResourceAttributesFieldRoot,
  ResourceOptionalAttributeFieldMeta,
  ResourceFieldName,
  AttributeValue
>

export type RequiredAttributeResourceField = ResourceField<
  ResourceAttributesFieldRoot,
  ResourceRequiredAttributeFieldMeta,
  ResourceFieldName,
  AttributeValue
>

export type RelationshipResourceField = ResourceField<
  ResourceRelationshipsFieldRoot,
  ResourceRelationshipFieldMeta,
  ResourceFieldName,
  RelationshipValue
>

export type ToOneRelationshipResourceField = ResourceField<
  ResourceRelationshipsFieldRoot,
  ResourceToOneRelationshipFieldMeta,
  ResourceFieldName,
  RelationshipValue
>

export type ToManyRelationshipResourceField = ResourceField<
  ResourceRelationshipsFieldRoot,
  ResourceToManyRelationshipFieldMeta,
  ResourceFieldName,
  RelationshipValue
>

class ResourceField<
  R extends ResourceFieldRoot,
  M extends ValuesOf<ResourceFieldMeta[R]>,
  N extends ResourceFieldName,
  T extends ResourceFieldValue
> {
  readonly root: R
  readonly meta: M
  readonly name: N
  readonly pointer: ResourceFieldPointer<R, N>
  readonly validate: Predicate<T>
  constructor(root: R, meta: M, name: N, predicate: Predicate<T>) {
    this.root = root
    this.meta = meta
    this.name = validateFieldName(name)
    this.pointer = [DATA, root, name]
    this.validate = predicate
  }

  toString(): string {
    return this.pointer.join('/')
  }

  getDataValue(data: ApiResponseResourceData<any>): Result<any, string> {
    if (!isObject(data)) {
      return error(`Invalid response: data must be an object`)
    }

    const root = data[this.root]
    if (isObject(root) && this.name in root) {
      if (this.isAttributeField()) {
        return ok(root[this.name])
      }
      if (isDataObject(root[this.name])) {
        return ok(root[this.name].data)
      }
      return error(`Invalid ${this.meta} relationship: must be an object with a data property`)
    }
    if (this.isOptionalAttributeField()) {
      return ok(undefined)
    }
    return error(`Invalid response: field "${this.name}" is missing from ${this.root}`)
  }

  setDataValue(data: ApiResponseResourceData<any>, value: Static<this['validate']>): void {
    if (this.root in data) {
      if (!isUndefined(value)) {
        data[this.root]![this.name] = value as any // todo: investigate any cast fix
      }
    } else {
      data[this.root] = createEmptyObject()
      return this.setDataValue(data, value)
    }
  }

  isAttributeField(): this is AttributeResourceField {
    return this.root === resourceFieldRoot.ATTRIBUTES
  }

  isOptionalAttributeField(): this is OptionalAttributeResourceField {
    return this.isAttributeField() && this.meta === resourceAttributeFieldMeta.OPTIONAL
  }

  isRequiredAttributeField(): this is RequiredAttributeResourceField {
    return this.isAttributeField() && this.meta === resourceAttributeFieldMeta.REQUIRED
  }

  isRelationshipField(): this is RelationshipResourceField {
    return this.root === resourceFieldRoot.RELATIONSHIPS
  }

  isToOneRelationshipField(): this is ToOneRelationshipResourceField {
    return this.isRelationshipField() && this.meta === resourceRelationshipFieldMeta.TO_ONE
  }

  isToManyRelationshipField(): this is ToManyRelationshipResourceField {
    return this.isRelationshipField() && this.meta === resourceRelationshipFieldMeta.TO_MANY
  }
}

const toOneRelationshipField = <T extends ResourceType>(type: T) => (
  target: any,
  name: ResourceFieldName,
): any => {
  const isBaseResourceIdentifierValue = or(isNull, isResourceIdentifierOfTypeFactory(type))
  target.fields[name] = new ResourceField(
    resourceFieldRoot.RELATIONSHIPS,
    resourceRelationshipFieldMeta.TO_ONE,
    name,
    isBaseResourceIdentifierValue,
  )
}

const toManyRelationshipField = <T extends ResourceType>(type: T) => (
  target: any,
  name: ResourceFieldName,
): any => {
  const isBaseResourceIdentifierValue = array(isResourceIdentifierOfTypeFactory(type))
  target.fields[name] = new ResourceField(
    resourceFieldRoot.RELATIONSHIPS,
    resourceRelationshipFieldMeta.TO_MANY,
    name,
    isBaseResourceIdentifierValue,
  )
}

const optionalAttribute = <T extends AttributeValue>(predicate: Predicate<T>) => (
  target: any,
  name: ResourceFieldName,
): any => {
  target.fields[name] = new ResourceField(
    resourceFieldRoot.ATTRIBUTES,
    resourceAttributeFieldMeta.OPTIONAL,
    name,
    predicate,
  )
}

const requiredAttribute = <T extends AttributeValue>(predicate: Predicate<T>) => (
  target: any,
  name: ResourceFieldName,
): any => {
  target.fields[name] = new ResourceField(
    resourceFieldRoot.ATTRIBUTES,
    resourceAttributeFieldMeta.REQUIRED,
    name,
    predicate,
  )
}

export type ResourceFieldNames<R extends AnyResource> = BaseResourceFieldNames<R>

export type ResourceFieldOptions<R extends AnyResource> = BaseResourceFieldOptions<R>

export type ResourceFieldModel = Record<string, ResourceFieldValue> & {
  type?: never
  id?: never
}

// RESOURCE IDENTIFIER OBJECT
export type AnyResourceIdentifier = ResourceIdentifier<ResourceType>
export type ResourceIdentifierKey = keyof AnyResourceIdentifier

export class ResourceIdentifier<T extends string> {
  [Symbol.species] = ResourceIdentifier
  type: T
  id: string

  constructor(type: T, id: string) {
    this.type = type
    this.id = id
  }
}

// RESOURCE
export type ResourceType = string
export type ResourceId = string
export type AnyResource = Resource<ResourceType, Record<string, any>>

export type ResourceToOneRelationship<R extends AnyResource> = Nullable<R>
export type ResourceToOneRelationshipIdentifier<R extends AnyResource> = Nullable<
  ResourceIdentifier<R['type']>
>

export type ResourceToManyRelationship<R extends AnyResource> = Array<R>
export type ResourceToManyRelationshipIdentifier<R extends AnyResource> = Array<
  ResourceIdentifier<R['type']>
>

export class Resource<T extends string, F extends ResourceFieldModel> extends ResourceIdentifier<
  T
> {
  constructor(values: Resource<T, F>) {
    super(values.type, values.id)
    Object.assign(this, values)
  }

  static type: ResourceType
  static fields: Record<string, {}>
}

export type ResourceConstructor<R extends AnyResource> = {
  new (resource: R): R
  type: R['type']
  fields: Record<BaseResourceFieldNames<R>, {}>
}

export const resource = <T extends string>(type: T) => {
  return class extends Resource<T, ResourceFieldModel> {
    static type: T = type
    static fields: Record<ResourceFieldName, ResourceField<any, any, any, any>> = Object.create(
      null,
    )
  }
}

type ResourceFieldsParameter<R extends AnyResource> = UnionToIntersection<
  BaseResourceFieldsUnion<R>
>

type ResourceIncludeParameter<R extends AnyResource> = BaseResourceIncludeThree<R>

// RESPONSE DATA
type JSONAPIVersion = '1.0' | '1.1'

type BaseApiResponse<M extends SerializableObject> = {
  meta?: ApiResponseMeta<M>
  links?: ApiLinksObject
  jsonapi?: {
    version?: JSONAPIVersion
  }
}

type BaseApiSuccessResponse<R extends AnyResource, M extends SerializableObject> = BaseApiResponse<
  M
> & {
  include?: Array<ApiResponseResourceData<R>>
}

type ApiErrorResponse<M extends SerializableObject> = BaseApiResponse<M> & {
  errors: Array<ApiRequestError>
}

type ApiSuccessResponse<R extends AnyResource, M extends SerializableObject> =
  | ApiResourceEntityResponse<R, M>
  | ApiResourceCollectionResponse<R, M>

type ApiResourceEntityResponse<
  R extends AnyResource,
  M extends SerializableObject
> = BaseApiSuccessResponse<R, M> & {
  data: ApiResponseResourceData<R>
}

type ApiResourceCollectionResponse<
  R extends AnyResource,
  M extends SerializableObject
> = BaseApiSuccessResponse<R, M> & {
  data: Array<ApiResponseResourceData<R>>
}

type ApiResponseResourceData<R extends AnyResource> = {
  type: R['type']
  id: ResourceId
  attributes?: WithoutNever<
    {
      [K in BaseResourceAttributeNames<R>]?: R[K]
    }
  >
  relationships?: {
    [K in BaseResourceRelationshipNames<R>]?: {
      data: BaseApiResponseDataResourceRelationshipValue<R[K]>
    }
  }
}

type ApiResponseMeta<M extends SerializableObject> = {
  [K in keyof M]: M[K]
}

type ApiLinksObjectValue =
  | string
  | {
      href: string
      meta: ApiResponseMeta<SerializableObject>
    }

type ApiLinksObject = {
  [key: string]: ApiLinksObjectValue | null
}

export type ApiRequestError = {
  id?: string
  links?: ApiLinksObject
  meta?: ApiResponseMeta<SerializableObject>
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
}

// BASE TYPES
type BaseApiResponseDataResourceRelationshipValue<T> = T extends ResourceToManyRelationship<
  AnyResource
>
  ? Array<BaseResourceTypeIdentifier<T[number]['type']>>
  : Nullable<BaseResourceTypeIdentifier<Extract<T, AnyResourceIdentifier>['type']>>

type BaseResourceTypeIdentifier<T> = T extends ResourceType ? ResourceIdentifier<T> : never

type BaseResourceFieldNames<T> = ValuesOf<
  {
    [K in keyof T]: K extends string ? (K extends ResourceIdentifierKey ? never : K) : never
  }
>

type BaseResourceAttributeNames<T> = ValuesOf<
  {
    [K in BaseResourceFieldNames<T>]: T[K] extends AttributeValue ? K : never
  }
>

type BaseResourceRelationshipNames<T> = ValuesOf<
  {
    [K in BaseResourceFieldNames<T>]: T[K] extends RelationshipValue ? K : never
  }
>

// type BaseResourceToOneRelationshipNames<T> = ValuesOf<
//   {
//     [K in BaseResourceFieldNames<T>]: T[K] extends ResourceToOneRelationship<AnyResource>
//       ? K
//       : never
//   }
// >

// type BaseResourceToManyRelationshipNames<T> = ValuesOf<
//   {
//     [K in BaseResourceFieldNames<T>]: T[K] extends ResourceToManyRelationship<AnyResource>
//       ? K
//       : never
//   }
// >

type BaseResourceFieldOptions<T> = T extends AnyResource
  ? {
      [K in T['type']]?: ReadonlyNonEmptyArray<BaseResourceFieldNames<T>>
    }
  : never

// Base Resource Type
type BaseResourceType<R> = R extends AnyResource ? R['type'] : never

// Extracts a Resource from a RelationshipValue
type BaseRelationshipResource<T> = T extends Array<AnyResource>
  ? T[number]
  : Extract<T, AnyResource>

// Extracts the Resource type of a Resource and all of its nested relationships
type BaseResourceTypeUnion<R, T = never> = R extends AnyResource
  ? R['type'] extends T
    ? T
    :
        | BaseResourceType<R>
        | {
            [K in keyof R]: BaseResourceTypeUnion<BaseRelationshipResource<R[K]>, T | R['type']>
          }[keyof R]
  : never

type TestBaseResourceTypeUnionA = Is<
  Expects<'a' | 'b' | 'c' | 'd' | 'e' | 'f', BaseResourceTypeUnion<A>>
>
type TestBaseResourceTypeUnionE = Is<Expects<'e' | 'f', BaseResourceTypeUnion<E>>>
type TestBaseResourceTypeUnionF = Is<Expects<'f', BaseResourceTypeUnion<F>>>
type TestBaseResourceTypeUnionNotResourceType = Not<Expects<ResourceType, BaseResourceTypeUnion<A>>>

// Extracts the Resources of all relationships in a Resource
type BaseResourceRelationshipsUnion<R> = R extends AnyResource
  ? {
      [K in keyof R]: BaseResourceUnion<BaseRelationshipResource<R[K]>, never>
    }[keyof R]
  : never

type TestBaseResourceRelationshipsUnionFromA = Is<
  Expects<A | B | C | D | E | F, BaseResourceRelationshipsUnion<A>>
>
type TestBaseResourceRelationshipsUnionFromE = Is<Expects<F, BaseResourceRelationshipsUnion<E>>>
type TestBaseResourceRelationshipsUnionFromF = Is<Expects<never, BaseResourceRelationshipsUnion<F>>>

// Extracts the Resources of a Resource and all of its nested relationships
type BaseResourceUnion<R, T = never> = R extends AnyResource
  ? R['type'] extends T
    ? R
    :
        | R
        | {
            [K in keyof R]: BaseResourceUnion<BaseRelationshipResource<R[K]>, T | R['type']>
          }[keyof R]
  : never

type TestBaseResourceUnionFromA = Is<Expects<A | B | C | D | E | F, BaseResourceUnion<A>>>
type TestBaseResourceUnionFromC = Is<Expects<A | B | C | D | E | F, BaseResourceUnion<C>>>
type TestBaseResourceUnionFromE = Is<Expects<E | F, BaseResourceUnion<E>>>
type TestBaseResourceUnionNotAnyResource = Not<Expects<AnyResource, BaseResourceUnion<A>>>

type BaseResourceFieldsUnion<R, T = never> = R extends AnyResource
  ? R['type'] extends T
    ? BaseResourceFieldOptions<R>
    :
        | BaseResourceFieldOptions<R>
        | {
            [K in keyof R]: BaseResourceFieldsUnion<BaseRelationshipResource<R[K]>, T | R['type']>
          }[keyof R]
  : never

type TestResourceFieldsUnion = Is<
  Expects<
    {
      a?: ReadonlyNonEmptyArray<'xa' | 'b' | 'cs'>
      b?: ReadonlyNonEmptyArray<'c'>
      c?: ReadonlyNonEmptyArray<'name' | 'ds'>
      d?: ReadonlyNonEmptyArray<'a' | 'es'>
      e?: ReadonlyNonEmptyArray<'f'>
      f?: ReadonlyNonEmptyArray<'xf'>
    },
    BaseResourceFieldsUnion<A>
  >
>

type BaseResourceIncludeThree<R> = R extends AnyResource
  ? Nullable<
      Partial<
        WithoutNever<
          {
            [K in keyof R]: BaseResourceIncludeThree<BaseRelationshipResource<R[K]>>
          }
        >
      >
    >
  : never

type TestResourceIncludeThree = BaseResourceIncludeThree<A>

const testResourceIncludeThree: TestResourceIncludeThree = {
  b: {
    c: {
      ds: {
        es: null,
      },
    },
  },
  cs: {
    ds: {
      es: {
        f: null,
      },
    },
  },
}

// RESOURCE FIELDS
const fields = <R extends AnyResource, F extends ResourceFieldsParameter<R>>(
  Resource: ResourceConstructor<R>,
  fields: F,
): ApiQueryFieldsParameter<R, F> => new ApiQueryFieldsParameter(Resource, fields)

const include = <R extends AnyResource, I extends BaseResourceIncludeThree<R>>(
  Resource: ResourceConstructor<R>,
  include: I,
): ApiQueryIncludeParameter<R, I> => new ApiQueryIncludeParameter(Resource, include as any)

type ApiQueryParameterName = string

class ApiQueryParameter<N extends ApiQueryParameterName, T extends ApiQueryParameterValue> {
  name: N
  value: T

  constructor(name: N, value: T) {
    this.name = name
    this.value = value
  }

  toString(): string {
    return ''
  }
}

type ApiEndpointSetup<R extends AnyResource> = {
  defaultIncludedFields: Nullable<NonEmptyArray<BaseResourceRelationshipNames<R>>>
}

const defaultApiEndpointSetup: ApiEndpointSetup<any> = {
  defaultIncludedFields: null,
}

type ResourcePatchValues<R extends AnyResource> = Partial<R>

class ApiEndpoint<R extends AnyResource, S extends ApiEndpointSetup<R>> {
  path: string
  Resource: ResourceConstructor<R>
  setup: S
  constructor(path: string, Resource: ResourceConstructor<R>, setup: Partial<S> = {}) {
    this.path = path
    this.Resource = Resource
    this.setup = { ...defaultApiEndpointSetup, ...setup } as S
  }

  get(id: ResourceId): void {}

  getToOneRelationship(id: ResourceId) {}

  getToManyRelationship(id: ResourceId) {}

  getCollection() {}

  create() {}

  update(id: ResourceId, values: ResourcePatchValues<R>) {}

  delete(id: ResourceId) {}
}

class ApiQueryFieldsParameter<
  R extends AnyResource,
  F extends ResourceFieldsParameter<R>
> extends ApiQueryParameter<typeof FIELDS, F & ApiQueryParameterObjectValue> {
  constructor(Resource: ResourceConstructor<R>, value: F) {
    super(FIELDS, value as any)
  }
}

class ApiQueryIncludeParameter<
  R extends AnyResource,
  I extends BaseResourceIncludeThree<R>
> extends ApiQueryParameter<typeof INCLUDE, I & ApiQueryParameterObjectValue> {
  constructor(Resource: ResourceConstructor<R>, value: F) {
    super(INCLUDE, value as any)
  }
}

type ApiQueryParameterArrayValue = Array<string | number> | Array<string>
type ApiQueryParameterObjectValue = {
  [key: string]: ApiQueryParameterValue
}

type ApiQueryParameterValue =
  | string
  | number
  | boolean
  | ApiQueryParameterArrayValue
  | ApiQueryParameterObjectValue

type ApiQueryParameters = {
  [key: string]: ApiQueryParameterValue
}

class Api {}

// JsonApi.Resource()

class A extends resource('a') {
  xa!: string
  @toOneRelationshipField('b') b!: B | null
  @toManyRelationshipField('c') cs!: C[]
}

class B extends resource('b') {
  @toOneRelationshipField('c') c!: C | null
}

class C extends resource('c') {
  @requiredAttribute(isString) name!: string
  @toManyRelationshipField('d') ds!: D[]
}

class D extends resource('d') {
  @toManyRelationshipField('e') es!: E[]
  @toOneRelationshipField('a') a!: A | null
}

class E extends resource('e') {
  @toOneRelationshipField('f') f!: F | null
}

class F extends resource('f') {
  xf!: string
}

const a: A = {} as any
a['b']

const aEndpoint = new ApiEndpoint('test', A)
const aEndpointDefaultIncludedFields = aEndpoint['setup']['defaultIncludedFields']

const aFields: ResourceFieldsParameter<A> = {
  a: ['b', 'cs'],
  b: ['c'],
  d: ['es'],
  f: ['xf'],
} as const

type ResourceFieldOptionsX<R extends AnyResource> = readonly Exclude<
  keyof R,
  ResourceIdentifierKey
>[]

const aInclude: ResourceIncludeParameter<A> = {
  cs: {
    ds: {
      es: {
        f: null,
      },
    },
  },
  b: {
    c: null,
  },
}

class ResourceParameters<R extends AnyResource> {
  fields?: ResourceFieldsParameter<R>
  include?: ResourceIncludeParameter<R>
}

const api = (...x: any[]) => {}
const endpoint = (...x: any[]) => {}

// const countries = endpoint('countries', A)

const oi: ResourceModelParameters<E> = {
  fields: aFields,
  include: {
    f: null,
  },
}

type ResourceModelParameters<R extends AnyResource> = {
  fields: ResourceFieldsParameter<R>
  include: ResourceIncludeParameter<R>
}

// FILTER RESOURCE
type BaseFilteredByFieldsResource<R, F> = R extends AnyResource
  ? F extends ReadonlyArray<keyof R>
    ? Pick<R, F[number] | ResourceIdentifierKey>
    : F extends undefined | null
    ? Pick<R, ResourceIdentifierKey>
    : Warning<'Invalid Resource fields parameter', R, F> // TODO: use Api/Endpoint setup to determine default included fields
  : never

type BaseResourceToManyRelationshipIdentifier<R> = R extends Array<AnyResource>
  ? Array<ResourceIdentifier<R[number]['type']>>
  : never

type BaseFilteredByIncludesResource<R, I, F> = R extends AnyResource
  ? {
      [K in keyof R]: R[K] extends Array<AnyResource>
        ? K extends keyof I
          ? BaseFilteredToManyRelationship<R[K], I[K], F>
          : BaseResourceToManyRelationshipIdentifier<R[K]>
        : R[K] extends AnyResource | null
        ? K extends keyof I
          ? BaseFilteredResource<Extract<R[K], AnyResource>, I[K], F> | null
          : ResourceIdentifier<Extract<R[K], AnyResource>['type']> | null
        : K extends keyof I
        ? Warning<'Invalid Resource include parameter', R, K>
        : R[K]
    }
  : R

type Warning<T extends string, U, V> = { message: T; context: U; value: V }

type BaseFilteredWithFieldsResourceX = BaseFilteredByFieldsResource<A, undefined>

type BaseFilteredResourceOfType<T, R, I, F> = T extends keyof F
  ? BaseFilteredByIncludesResource<BaseFilteredByFieldsResource<R, F[T]>, I, F>
  : BaseFilteredByIncludesResource<R, I, F>

type BaseFilteredResource<R, I, F> = R extends AnyResource
  ? BaseFilteredResourceOfType<R['type'], R, I, F>
  : never

type BaseFilteredToManyRelationship<R, I, F> = R extends Array<AnyResource>
  ? Array<BaseFilteredResource<R[number], I, F>>
  : never

type FilteredResource<
  R extends AnyResource,
  P extends ResourceParameters<R>
> = BaseFilteredResource<R, P['include'], P['fields']>

class AFilter extends ResourceParameters<A> {
  fields = {
    c: ['ds'],
    e: ['f'],
    f: ['xf'],
  } as const
  include = {
    b: {
      c: {
        ds: null,
      },
    },
    cs: null,
  }
}

type X = FilteredResource<A, AFilter>

const OK = 'OK'
const ERROR = 'error'

type Result<T, E extends Error | PropertyKey> = OKResult<T> | ErrorResult<E>
type ResultState = typeof OK | typeof ERROR

interface BaseResult<S extends ResultState, T, E extends Error | PropertyKey> {
  state: S
  value: T | E
  unwrap(): T | never
  map<O>(transform: (value: T) => O): Result<O, E>
  isOK(): this is OKResult<T>
  isError(): this is ErrorResult<E>
}

class OKResult<T> implements BaseResult<typeof OK, T, never> {
  state: typeof OK = OK
  value: T

  constructor(value: T) {
    this.value = value
  }

  unwrap(): T {
    return this.value
  }

  map<O>(transform: (value: T) => O): OKResult<O> {
    return OKResult.of(transform(this.value))
  }

  isOK(): this is OKResult<T> {
    return true
  }

  isError(): this is ErrorResult<never> {
    return false
  }

  static of<T>(value: T): OKResult<T> {
    return new OKResult(value)
  }
}

class ErrorResult<E extends Error | PropertyKey> implements BaseResult<typeof ERROR, unknown, E> {
  state: typeof ERROR = ERROR
  value: E

  constructor(error: E) {
    this.value = error
  }

  unwrap(): never {
    throw this.value
  }

  map(transform: (value: any) => any): this {
    return this
  }

  isOK(): this is OKResult<never> {
    return false
  }

  isError(): this is ErrorResult<E> {
    return true
  }

  static of<E extends Error | PropertyKey>(error: E): ErrorResult<E> {
    return new ErrorResult(error)
  }
}

const x: Result<string, TypeError> = {} as any

switch (x.state) {
  case OK:
    console.log(x.value)
    break
  case ERROR:
    console.warn(x.value)
}

if (x.isOK()) {
  x.value
} else {
  x.value
}

// Type assertion types
type Is<T extends Ok<any, any>> = T
type Not<T extends Err<any, any>> = T

type Expects<Expected, Input> = Extract<Expected extends Input ? 1 : 0, 0> extends never
  ? Extract<Input extends Expected ? 1 : 0, 0> extends never
    ? Ok<Expected, Input>
    : Err<Expected, Input>
  : Err<Expected, Input>

type Ok<T, U> = { result: 'OK'; expected: T; actual: U }
type Err<T, U> = { result: 'ERR'; expected: T; actual: U }
