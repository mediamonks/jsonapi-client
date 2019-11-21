import {
  isString,
  isObject,
  isUndefined,
  either,
  isArray,
  isNone,
  Predicate,
  Static,
  Some,
  None,
  shape,
  at,
  isFunction,
} from 'isntnt'
import { createEmptyObject } from './src/utils/data'
import { Validation } from './Validation'
import { parseResourceParameters, joinParameters, parseApiQuery } from './formatting'

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

type PreventExcessivelyDeepRecursionError = any

// See https://github.com/Microsoft/TypeScript/issues/29594#issuecomment-507673155
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((
  k: infer I,
) => void)
  ? I
  : never

// type NonEmptyArray<T> = Array<T> & { 0: T }
type ReadonlyNonEmptyArray<T> = ReadonlyArray<T> & { 0: T }

// CONSTANTS
const EMPTY_ARRAY: Array<any> = Object.freeze([]) as any
const EMPTY_OBJECT: {} = Object.freeze(createEmptyObject())

const ID = 'id' as const
const TYPE = 'type' as const

const ATTRIBUTES = 'attributes' as const
const RELATIONSHIPS = 'relationships' as const
const DATA = 'data' as const

const OPTIONAL = 'optional' as const
const REQUIRED = 'required' as const

const TO_ONE = 'to-one' as const
const TO_MANY = 'to-many' as const

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
const isResourceIdentifierKey = either(TYPE, ID)

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

const validateFieldName = createRulesValidator('field name', [
  [isString, 'be a string'],
  [not(isResourceIdentifierKey), `not be a resource identifier key (${TYPE} or ${ID})`],
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

export type AttributeValue = OptionalAttributeValue | RequiredAttributeValue
export type OptionalAttributeValue = RequiredAttributeValue | undefined
export type NullableAttributeValue = RequiredAttributeValue | null
export type RequiredAttributeValue =
  | string
  | number
  | boolean
  | SerializableArray
  | (SerializableObject & {
      relationships?: never
      fields?: never
    })

export type RelationshipValue = ToOneRelationshipValue | ToManyRelationshipValue
export type ToOneRelationshipValue = Nullable<AnyResource>
export type ToManyRelationshipValue = Array<AnyResource>

export type OptionalAttribute<T extends AttributeValue> = T | undefined
export type NullableAttribute<T extends AttributeValue> = T | null
export type RequiredAttribute<T extends AttributeValue> = T

export type ToOneRelationship<R extends AnyResource> = Nullable<R>
export type ToManyRelationship<R extends AnyResource> = Array<R>

// RESOURCE FIELD
export type ResourceFieldPointer<R extends ResourceFieldRoot, N extends ResourceFieldName> = [
  typeof DATA,
  R,
  N,
]

export type AnyResourceField =
  | ResourceAttributeField<ResourceAttributeFieldMeta, ResourceFieldName, AttributeValue>
  | ResourceRelationshipField<ResourceRelationshipFieldMeta, ResourceFieldName, ResourceType>

// export type ResourceAttributeField<
//   M extends ResourceAttributeFieldMeta,
//   N extends ResourceFieldName,
//   T extends AttributeValue
// > = ResourceField<ResourceAttributesFieldRoot, M, N, T>

export type ResourceOptionalAttributeField<
  N extends ResourceFieldName,
  T extends OptionalAttributeValue
> = ResourceAttributeField<ResourceOptionalAttributeFieldMeta, N, T | undefined>

export type ResourceRequiredAttributeField<
  N extends ResourceFieldName,
  T extends RequiredAttributeValue
> = ResourceAttributeField<ResourceRequiredAttributeFieldMeta, N, T>

// export type ResourceRelationshipField<
//   M extends ResourceRelationshipFieldMeta,
//   N extends ResourceFieldName,
//   R extends RelationshipValue
// > = ResourceField<ResourceRelationshipsFieldRoot, M, N, R>

export type ResourceToOneRelationshipField<
  N extends ResourceFieldName,
  T extends ResourceType
> = ResourceRelationshipField<ResourceToOneRelationshipFieldMeta, N, T>

export type ResourceToManyRelationshipField<
  N extends ResourceFieldName,
  T extends ResourceType
> = ResourceRelationshipField<ResourceToManyRelationshipFieldMeta, N, T>

export class ResourceField<
  R extends ResourceFieldRoot,
  M extends ValuesOf<ResourceFieldMeta[R]>,
  N extends ResourceFieldName,
  T extends ResourceFieldValue
> {
  readonly root: R
  readonly meta: M
  readonly name: N
  readonly pointer: ResourceFieldPointer<R, N>
  constructor(root: R, meta: M, name: N) {
    this.root = root
    this.meta = meta
    this.name = validateFieldName(name)
    this.pointer = [DATA, root, name]
  }

  toString(): string {
    return this.pointer.join('/')
  }

  decodeValue(value: T): T {
    return value
  }

  encodeValue(value: T): T {
    return value
  }

  isAttributeField(): this is ResourceAttributeField<any, any, any> {
    return this.root === resourceFieldRoot.ATTRIBUTES
  }

  isOptionalAttributeField(): this is ResourceOptionalAttributeField<any, any> {
    return this.isAttributeField() && this.meta === resourceAttributeFieldMeta.OPTIONAL
  }

  isRequiredAttributeField(): this is ResourceRequiredAttributeField<any, any> {
    return this.isAttributeField() && this.meta === resourceAttributeFieldMeta.REQUIRED
  }

  isRelationshipField(): this is ResourceRelationshipField<any, any, any> {
    return this.root === resourceFieldRoot.RELATIONSHIPS
  }

  isToOneRelationshipField(): this is ResourceToOneRelationshipField<any, any> {
    return this.isRelationshipField() && this.meta === resourceRelationshipFieldMeta.TO_ONE
  }

  isToManyRelationshipField(): this is ResourceToManyRelationshipField<any, any> {
    return this.isRelationshipField() && this.meta === resourceRelationshipFieldMeta.TO_MANY
  }

  static isResourceField(value: unknown): value is ResourceField<any, any, any, any> {
    return value instanceof ResourceField
  }
}

export class ResourceAttributeField<
  M extends ResourceAttributeFieldMeta,
  N extends ResourceFieldName,
  T extends AttributeValue
> extends ResourceField<typeof ATTRIBUTES, M, N, RelationshipValue> {
  readonly predicate: Predicate<T>
  constructor(kind: M, name: N, predicate: Predicate<T>) {
    super('attributes', kind, name)
    this.predicate = predicate
  }
}

export class ResourceRelationshipField<
  M extends ResourceRelationshipFieldMeta,
  N extends ResourceFieldName,
  T extends ResourceType
> extends ResourceField<typeof RELATIONSHIPS, M, N, ResourceIdentifier<T>> {
  readonly type: T
  constructor(kind: M, name: N, type: T) {
    super('relationships', kind, name)
    this.type = type
  }
}

export const toOneRelationship = <T extends ResourceType>(
  type: T | (() => ResourceConstructor<AnyResource>),
) => (target: any, name: ResourceFieldName): any => {
  if (isFunction(type)) {
    type = type().type as T
  }
  target.constructor.fields[name] = new ResourceRelationshipField(
    resourceRelationshipFieldMeta.TO_ONE,
    name,
    type,
  )
}

export const toManyRelationship = <T extends ResourceType>(type: T) => (
  target: any,
  name: ResourceFieldName,
): any => {
  target.constructor.fields[name] = new ResourceRelationshipField(
    resourceRelationshipFieldMeta.TO_MANY,
    name,
    type,
  )
}

export const optionalAttribute = <T extends AttributeValue>(predicate: Predicate<T>) => (
  target: any,
  name: ResourceFieldName,
): any => {
  target.constructor.fields[name] = new ResourceAttributeField(
    resourceAttributeFieldMeta.OPTIONAL,
    name,
    predicate,
  )
}

export const nullableAttribute = <T extends AttributeValue>(predicate: Predicate<T>) => (
  target: any,
  name: ResourceFieldName,
): any => {
  target.constructor.fields[name] = new ResourceAttributeField(
    resourceAttributeFieldMeta.OPTIONAL,
    name,
    predicate,
  )
}

export const requiredAttribute = <T extends AttributeValue>(predicate: Predicate<T>) => (
  target: any,
  name: ResourceFieldName,
): any => {
  target.constructor.fields[name] = new ResourceAttributeField(
    resourceAttributeFieldMeta.REQUIRED,
    name,
    predicate,
  )
}

export type ResourceFieldNames<R extends AnyResource> = BaseResourceFieldNames<R>

export type ResourceFieldOptions<R extends AnyResource> = BaseResourceFieldOptions<R>

export type ResourceFieldModel = Record<ResourceFieldName, ResourceFieldValue> & {
  type?: never
  id?: never
}

// RESOURCE IDENTIFIER OBJECT
export type AnyResourceIdentifier = ResourceIdentifier<ResourceType>
export type ResourceIdentifierKey = keyof AnyResourceIdentifier

export class ResourceIdentifier<T extends string> {
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
export type AnyResource = ApiResource<
  {
    [key: string]: ResourceFieldValue
  } & {
    type: ResourceType
    id: ResourceId
  }
>

export class ApiResource<R extends AnyResource> extends ResourceIdentifier<R['type']> {
  constructor(values: R) {
    super(values.type, values.id)
    Object.assign(this, values)
  }

  static fields: Record<ResourceFieldName, AnyResourceField> = createEmptyObject()
  static Identifier: new (id: ResourceId) => ResourceIdentifier<any>
}

export type ResourceAttributeFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends RelationshipValue ? never : ResourceAttributeField<any, any, any>
  }
>

export type ResourceRelationshipFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends RelationshipValue
      ? ResourceRelationshipField<any, any, any>
      : never
  }
>

export type ResourceToOneRelationshipFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends ToOneRelationshipValue
      ? ResourceToOneRelationshipField<any, any>
      : never
  }
>

export type ResourceToManyRelationshipFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends ToManyRelationshipValue
      ? ResourceToManyRelationshipField<ResourceFieldName, any>
      : never
  }
>

export type ResourceFields<R extends AnyResource> = {
  [K in keyof R]: R[K] extends RelationshipValue
    ? ResourceRelationshipField<any, any, any>
    : ResourceAttributeField<any, any, any>
}

export type ResourceConstructor<R extends AnyResource> = {
  new (resource: R): R
  type: R['type']
  fields: Record<ResourceFieldName, AnyResourceField>
  Identifier: new (id: ResourceId) => AnyResourceIdentifier
}

export type BaseResourceFieldsModel<T> = {
  [K in keyof T]: K extends ResourceIdentifierKey
    ? ResourceFieldError<'Invalid Field Name', K>
    : T[K] extends ResourceFieldValue
    ? T[K]
    : ResourceFieldError<'Invalid Field Value', { [X in K]: T[K] }>
}

export type ResourceFieldError<M extends string, T> = M & { value: T }

export const resource = <T extends ResourceType>(type: T) => {
  return class Resource<
    M extends BaseResourceFieldsModel<Omit<M, ResourceIdentifierKey>>
  > extends ApiResource<ResourceIdentifier<T> & M> {
    static type: T = type
    static fields: Record<ResourceFieldName, AnyResourceField> = createEmptyObject()
    static Identifier = class extends ResourceIdentifier<T> {
      constructor(id: ResourceId) {
        super(type, id)
      }
    }
  }
}

export type ResourceIncludeParameter<R extends AnyResource> = BaseResourceIncludeThree<R>

export type ResourceFieldsParameter<R extends AnyResource> = Partial<
  UnionToIntersection<BaseResourceFieldsUnion<R>>
>

// RESPONSE DATA
export type JSONAPIVersion = '1.0' | '1.1'
export type JSONAPIMeta = SerializableObject

type BaseApiResponse<M extends SerializableObject> = {
  meta?: ApiResponseMeta<M>
  links?: ApiLinksObject
  jsonapi?: {
    version?: JSONAPIVersion
  }
}

type BaseApiResponseIncludedResources = Array<AnyResource>

type BaseApiSuccessResponse<R extends AnyResource, M extends JSONAPIMeta> = BaseApiResponse<M> & {
  included?: BaseApiResponseIncludedResources
}

type ApiResponse<R extends AnyResource, M extends JSONAPIMeta> =
  | ApiErrorResponse<M>
  | ApiSuccessResponse<R | R[], M>

type ApiErrorResponse<M extends SerializableObject> = BaseApiResponse<M> & {
  errors: Array<ApiRequestError>
}

type ApiSuccessResponse<
  R extends AnyResource | Array<AnyResource>,
  M extends JSONAPIMeta
> = R extends Array<AnyResource>
  ? ApiResourceCollectionResponse<R[number], M>
  : ApiResourceEntityResponse<Extract<R, AnyResource>, M>

type ApiResourceEntityResponse<
  R extends AnyResource,
  M extends SerializableObject
> = BaseApiSuccessResponse<R, M> & {
  data: ApiResponseResourceData<R>
}

type TestApiResourceEntityResponse = ApiResourceEntityResponse<A, {}>

type ApiResourceCollectionResponse<
  R extends AnyResource,
  M extends SerializableObject
> = BaseApiSuccessResponse<R, M> & {
  data: Array<ApiResponseResourceData<R>>
}

type BaseApiResponseResourceDataAttributes<R, N> = N extends keyof R
  ? {
      [K in N]: R[K]
    }
  : never

type BaseApiResponseResourceDataRelationships<R, N> = N extends keyof R
  ? {
      [K in N]: { data: R[K] }
    }
  : never

type ApiResponseResourceData<R extends AnyResource> = {
  type: R['type']
  id: ResourceId
  attributes: BaseApiResponseResourceDataAttributes<R, BaseResourceAttributeNames<R>>
  relationships: BaseApiResponseResourceDataRelationships<
    FilteredResource<R, {}>, // filter included fields
    BaseResourceRelationshipNames<R>
  >
}

type TestApiResponseResourceData = ApiResponseResourceData<FilteredA>

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
type BaseApiResponseDataResourceRelationshipValue<T> = T extends ToManyRelationship<AnyResource>
  ? Array<BaseResourceTypeIdentifier<T[number]['type']>>
  : Nullable<BaseResourceTypeIdentifier<Extract<T, AnyResourceIdentifier>['type']>>

type BaseResourceTypeIdentifier<T> = T extends ResourceType ? ResourceIdentifier<T> : never

type BaseResourceFieldNames<T> = Exclude<
  ValuesOf<
    {
      [K in keyof T]: K extends string ? (K extends ResourceIdentifierKey ? never : K) : never
    }
  >,
  undefined
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

type BaseResourceFieldOptions<T> = T extends AnyResource
  ? {
      [K in T['type']]: ReadonlyNonEmptyArray<BaseResourceFieldNames<T>>
    }
  : never

// Extracts a Resource from a RelationshipValue
type BaseRelationshipResource<T> = T extends Array<AnyResource>
  ? T[number]
  : Extract<T, AnyResource>

// Extracts the Resource type of a Resource and all of its nested relationships
type BaseResourceTypeUnion<R, T = never> = R extends AnyResource
  ? R['type'] extends T
    ? T
    :
        | R['type']
        | Exclude<
            {
              [K in keyof R]: BaseResourceTypeUnion<BaseRelationshipResource<R[K]>, T | R['type']>
            }[keyof R],
            undefined
          >
  : never

type TestBaseResourceTypeUnionA = Is<
  Expects<'a' | 'b' | 'c' | 'd' | 'e' | 'f', BaseResourceTypeUnion<A>>
>
type TestBaseResourceTypeUnionE = Is<Expects<'e' | 'f', BaseResourceTypeUnion<E>>>
type TestBaseResourceTypeUnionF = Is<Expects<'f', BaseResourceTypeUnion<F>>>
type TestBaseResourceTypeUnionNotResourceType = Not<Expects<ResourceType, BaseResourceTypeUnion<A>>>

// Extracts the Resources of all relationships in a Resource
type BaseResourceRelationshipsUnion<R> = R extends AnyResource
  ? Exclude<
      {
        [K in keyof R]: BaseResourceUnion<BaseRelationshipResource<R[K]>, never>
      }[keyof R],
      undefined
    >
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
        | Exclude<
            {
              [K in keyof R]: BaseResourceUnion<BaseRelationshipResource<R[K]>, T | R['type']>
            }[keyof R],
            undefined
          >
  : never

type TestBaseResourceUnionFromA = Is<Expects<A | B | C | D | E | F, BaseResourceUnion<A>>>
type TestBaseResourceUnionFromC = Is<Expects<A | B | C | D | E | F, BaseResourceUnion<C>>>
type TestBaseResourceUnionFromE = Is<Expects<E | F, BaseResourceUnion<E>>>
type TestBaseResourceUnionNotAnyResource = Not<Expects<AnyResource, BaseResourceUnion<A>>>

type BaseResourceFieldsUnionA = BaseResourceFieldsUnion<A>

type BaseResourceFieldsUnion<R, T = never> = R extends AnyResource
  ? R['type'] extends T
    ? BaseResourceFieldOptions<R>
    :
        | BaseResourceFieldOptions<R>
        | Exclude<
            {
              [K in keyof R]: BaseResourceFieldsUnion<BaseRelationshipResource<R[K]>, T | R['type']>
            }[keyof R],
            undefined
          >
  : never

type TestResourceFieldsUnion = Is<
  Expects<
    {
      a: ReadonlyNonEmptyArray<'xa' | 'b' | 'cs'>
      b: ReadonlyNonEmptyArray<'c'>
      c: ReadonlyNonEmptyArray<'name' | 'ds'>
      d: ReadonlyNonEmptyArray<'a' | 'es'>
      e: ReadonlyNonEmptyArray<'f'>
      f: ReadonlyNonEmptyArray<'xf'>
    },
    UnionToIntersection<BaseResourceFieldsUnion<A>>
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

type TestResourceIncludeThree = Is<Expects<{} | null, BaseResourceIncludeThree<A>>>

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

const NONE = 'none' as const
const PRIMARY = 'primary' as const

type ApiDefaultIncludedFields = typeof NONE | typeof PRIMARY

type Fetch = Window['fetch']
type FetchOptions = RequestInit

type ApiSetupWithDefaults<S extends Partial<ApiSetupOptions>> = Exclude<
  keyof ApiSetupOptions,
  keyof S
> extends never
  ? DefaultApiSetup
  : Omit<DefaultApiSetup, keyof S> &
      {
        [K in keyof S]: S[K]
      }

type Transform<I, O = I> = (value: I, ...rest: unknown[]) => O

type ApiSetupOptions = {
  version: JSONAPIVersion
  defaultIncludedRelationships: ApiDefaultIncludedFields
  fetchAdapter: Fetch
  beforeRequest: Transform<Request>
  transformRelationshipPath: Transform<ResourceFieldName>
  createPageQuery: Contract<[any], ApiQueryParameterValue>
}

type Contract<T extends Array<any>, O> = (...rest: T) => O

type DefaultApiSetup = ApiSetupOptions & {
  version: '1.0'
  defaultIncludedRelationships: typeof NONE
}

const JSONAPIVersions: Array<JSONAPIVersion> = ['1.0', '1.1']

const isJSONAPIVersion = either(...JSONAPIVersions)
const isBodyWithJSONAPIVersion = shape({ jsonapi: at('version', not(isUndefined)) })

// type SetupWithDefaults<S extends Partial<ApiSetupOptions>> = Required<
//   {
//     [K in keyof ApiSetupOptions]: K extends keyof S ? S[K] | 1 : DefaultApiSetup[K] | 0
//   }
// >

// type OI = SetupWithDefaults<{
//   version: '1.0'
// }>

const reflect = <T>(value: T): T => value

const defaultApiSetup: DefaultApiSetup = {
  version: '1.0',
  defaultIncludedRelationships: NONE,
  fetchAdapter: window.fetch,
  beforeRequest: reflect,
  transformRelationshipPath: reflect,
  createPageQuery: reflect,
}

type AnyApiClient = ApiClient<any>

export class ApiClient<S extends Partial<ApiSetupOptions>> {
  url: URL
  setup: ApiSetupWithDefaults<S>
  resources: Record<ResourceType, ResourceConstructor<AnyResource>> = createEmptyObject()

  constructor(url: URL, setup: S = EMPTY_OBJECT as any) {
    this.url = url
    this.setup = { ...defaultApiSetup, ...setup } as any
  }

  endpoint<R extends AnyResource>(
    path: string,
    Resource: ResourceConstructor<R>,
  ): ApiEndpoint<this, R> {
    return new ApiEndpoint(this, path, Resource)
  }

  register(...resources: Array<ResourceConstructor<any>>): void {
    resources.forEach((Resource) => this.addResource(Resource))
  }

  addResource(Resource: ResourceConstructor<any>): void {
    if (Resource.type in this.resources && Resource !== this.resources[Resource.type]) {
      console.warn(`Attempt to replace Resource of type ${Resource.type}`)
    }
    this.resources[Resource.type] = Resource
  }

  getResourceByType(type: ResourceType): ResourceConstructor<AnyResource> {
    const Resource = this.resources[type]
    if (isUndefined(Resource)) {
      throw new Error(`Resource of type "${type}" does not exist on ApiClient`)
    }
    return Resource
  }

  async handleFetchRequest<R extends AnyResource | Array<AnyResource>, M extends JSONAPIMeta>(
    url: URL,
    options: FetchOptions,
  ): Promise<ApiSuccessResponse<R, M>> {
    const fetchAdapter: Fetch = this.setup.fetchAdapter!
    const request = this.setup.beforeRequest!(new Request(url.href, options))
    return fetchAdapter(request)
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json()
      })
      .then((body) => {
        if (isBodyWithJSONAPIVersion(body)) {
          if (!isJSONAPIVersion(body.jsonapi.version)) {
            throw new Error(`Invalid JSON:API version`)
          } else if (body.jsonapi.version !== this.setup.version) {
            throw new Error(`JSON:API version must equal ${this.setup.version}`)
          }
        }
        if (isArray(body.errors)) {
          // TODO: parse body errors
          throw new Error(`Found ${body.errors.length} errors in response`)
        }
        return body
      })
      .catch((error) => {
        console.warn(error)
        throw new Error(`Invalid Response`)
      })
  }

  decodeIncludedResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    identifier: ResourceIdentifier<R['type']>,
    included: BaseApiResponseIncludedResources | undefined,
    fieldsParameter: ResourceFieldsParameter<R>,
    includeParameter: ResourceIncludeParameter<R>,
    pointer: ReadonlyArray<string>,
  ): Validation<R, ApiError<any>[]> {
    if (isUndefined(included)) {
      return Validation.failure([
        new ApiResponseError(`Included resource data is undefined`, included, ['included']),
      ])
    }
    const includedData = included.find(
      (includedData) => includedData.type === identifier.type && includedData.id === identifier.id,
    )
    if (isUndefined(includedData)) {
      return Validation.failure([
        new ApiResponseError(
          `Included resource not found for Resource "${Resource.type}" with id "${identifier.id}"`,
          identifier,
          pointer,
        ),
      ])
    }
    return (this.decodeResource as PreventExcessivelyDeepRecursionError)(
      Resource,
      includedData,
      included,
      fieldsParameter,
      includeParameter,
      pointer.concat(identifier.id),
    )
  }

  decodeResourceIdentifier<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    identifier: ResourceIdentifier<R['type']>,
    pointer: ReadonlyArray<string>,
  ): Validation<ResourceIdentifier<R['type']>, ApiError<any>[]> {
    if (!isObject(identifier)) {
      return Validation.failure([
        new ApiResponseError(`Resource identifier must be an object`, identifier, pointer),
      ])
    }

    const result: Partial<ResourceIdentifier<R['type']>> = createEmptyObject()
    const errors: Array<ApiValidationError> = []

    if (identifier.type === Resource.type) {
      result.type = identifier.type
    } else {
      errors.push(
        new ApiValidationError(
          `Resource type must equal ${Resource.type}`,
          identifier.type,
          pointer.concat('type'),
        ),
      )
    }

    if (isString(identifier.id)) {
      result.id = identifier.id
    } else {
      errors.push(
        new ApiValidationError(`Resource id must be a string`, identifier.id, pointer.concat('id')),
      )
    }

    return errors.length
      ? Validation.failure(errors)
      : Validation.success(result as ResourceIdentifier<R['type']>)
  }

  getResourceField<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    name: ResourceFieldName,
  ): AnyResourceField {
    const field = Resource.fields[name]
    if (isUndefined(field)) {
      throw new Error(
        `Field of name "${name}" does not exist on Resource of type "${Resource.type}"`,
      )
    }
    return field
  }

  decodeResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    data: ApiResponseResourceData<R>,
    included: BaseApiResponseIncludedResources | undefined,
    fieldsParameter: ResourceFieldsParameter<R>,
    includeParameter: ResourceIncludeParameter<R>,
    pointer: ReadonlyArray<string>,
  ): Validation<R, ApiError<any>[]> {
    return this.decodeResourceIdentifier(Resource, data, pointer).map((validation) => {
      if (validation.isFailure()) {
        return validation
      }

      // TODO: should the data of a resource be added to the included data because
      // a relationship MAY depend on it?
      if (isArray(included)) {
        included.push(data)
      }

      const resource = validation.value as Record<ResourceFieldName, any>
      const errors: Array<ApiError<any>> = []
      const fieldNames: Array<ResourceFieldNames<R>> =
        (fieldsParameter as any)[Resource.type] || Object.keys(Resource.fields)

      fieldNames.forEach(<N extends ResourceFieldName>(name: N) => {
        const field = this.getResourceField(Resource, name)
        const root = data[field.root]
        if (isObject(root)) {
          const value = (root as any)[name] // WTF?
          if (field.isAttributeField()) {
            if (field.predicate(value)) {
              resource[name] = value
            } else if (isNone(value)) {
              if (field.isRequiredAttributeField()) {
                errors.push(
                  new ApiValidationError(
                    `Value for attribute field "${field.name}" of Resource "${Resource.type}" is required`,
                    value,
                    pointer.concat(field.pointer),
                  ),
                )
              }
            } else {
              errors.push(
                new ApiValidationError(
                  `Value for attribute field "${field.name}" of Resource "${Resource.type}" does not match its predicate`,
                  value,
                  pointer.concat(field.pointer),
                ),
              )
            }
          } else if (field.isToOneRelationshipField()) {
            const RelationshipResource = this.getResourceByType(field.type)
            const resourceData = (value || EMPTY_OBJECT).data
            if (isNone(resourceData)) {
              resource[name] = null
            } else {
              if (name in includeParameter) {
                const relationshipIncludeParameter = (includeParameter as any)[name] || EMPTY_OBJECT
                this.decodeIncludedResource(
                  RelationshipResource,
                  resourceData,
                  included,
                  fieldsParameter as PreventExcessivelyDeepRecursionError,
                  relationshipIncludeParameter,
                  pointer.concat(field.pointer),
                )
                  .mapSuccess((value) => {
                    resource[name] = value
                  })
                  .mapFailure((value) => {
                    value.forEach((error) => errors.push(error))
                  })
              } else {
                this.decodeResourceIdentifier(
                  RelationshipResource,
                  resourceData,
                  pointer.concat(field.pointer),
                )
                  .mapSuccess((value) => {
                    resource[name] = value
                  })
                  .mapFailure((value) => {
                    value.forEach((error) => errors.push(error))
                  })
              }
            }
          } else if (field.isToManyRelationshipField()) {
            const RelationshipResource = this.getResourceByType(field.type)
            const relationshipPointer = pointer.concat(field.pointer)
            const resourceData: Array<AnyResource> = (value || EMPTY_OBJECT).data

            if (isUndefined(resourceData)) {
              resource[name] = []
            } else if (!isArray(resourceData)) {
              errors.push(
                new ApiResponseError(
                  `Value for to-many relationship  field "${field.name}" of Resource "${Resource.type}" must be an Array`,
                  resourceData,
                  pointer.concat(field.pointer),
                ),
              )
            } else if (name in includeParameter) {
              resource[name] = []
              resourceData.forEach((identifier) => {
                const relationshipIncludeParameter = (includeParameter as any)[name] || EMPTY_OBJECT
                this.decodeIncludedResource(
                  RelationshipResource,
                  identifier,
                  included,
                  fieldsParameter as PreventExcessivelyDeepRecursionError,
                  relationshipIncludeParameter,
                  relationshipPointer,
                )
                  .mapSuccess((value) => {
                    resource[name].push(value)
                  })
                  .mapFailure((value) => {
                    value.forEach((error) => errors.push(error))
                  })
              })
            } else {
              resource[name] = []
              resourceData.forEach((identifier: AnyResource) => {
                this.decodeResourceIdentifier(RelationshipResource, identifier, relationshipPointer)
                  .mapSuccess((value) => {
                    resource[name].push(value)
                  })
                  .mapFailure((value) => {
                    value.forEach((error) => errors.push(error))
                  })
              })
            }
          }
        } else if (field.isRequiredAttributeField()) {
          errors.push(
            new ApiResponseError(
              `Data ${field.root} must be an object with a "${name}" property`,
              root,
              pointer,
            ),
          )
        } else if (field.isToManyRelationshipField()) {
          resource[name] = []
        } else {
          resource[name] = null
        }
      })

      return errors.length
        ? Validation.failure(errors)
        : Validation.success(new Resource(resource as any))
    })
  }

  async getResourceEntity<
    R extends AnyResource,
    M extends JSONAPIMeta,
    P extends ApiResourceParameters<R>
  >(
    Resource: ResourceConstructor<R>,
    path: string,
    ResourceParameters: new () => P,
  ): Promise<BaseApiEntityResult<FilteredResource<R, P>, M>> {
    const resourceParameters = new ResourceParameters()
    const url = new URL(path, this.url) // TODO: add search params to url
    url.search = joinParameters(
      parseResourceParameters(resourceParameters as PreventExcessivelyDeepRecursionError),
    )

    return this.handleFetchRequest<R, M>(url, {} /* TODO: add options */).then((response) => {
      return this.decodeResource(
        Resource as any, // (1) This is odd, R (that extends AnyResource) is incompatible with AnyResource
        response.data,
        response.included,
        resourceParameters.fields || EMPTY_OBJECT,
        resourceParameters.include || createDefaultIncludeParameters(this, Resource),
        EMPTY_ARRAY, // Use frozen array to catch property modifications
      )
        .mapSuccess((value: AnyResource) => {
          // AnyResource Should be R, see 1
          return new ApiEntityResult(value, response.meta || {})
        })
        .unwrap() as any
    })
  }

  async getResourceCollection<R extends AnyResource, P extends ApiResourceParameters<R>>(
    Resource: ResourceConstructor<R>,
    path: string,
    queryParameters: Nullable<ApiQueryParameters<this>>,
    ResourceParameters: new () => P,
  ): Promise<BaseApiCollectionResult<FilteredResource<R, P>[], SerializableObject>> {
    const resourceParameters = new ResourceParameters()
    const url = new URL(path, this.url) // TODO: add search params to url
    url.search = joinParameters(
      parseResourceParameters(resourceParameters as PreventExcessivelyDeepRecursionError).concat(
        parseApiQuery(this, queryParameters || EMPTY_OBJECT),
      ),
    )

    return this.handleFetchRequest<R[], SerializableObject>(url, {} /* TODO: add options */).then(
      (response) => {
        const resources: Array<R> = []
        const errors: Array<Error> = []
        ;(response as ApiResourceCollectionResponse<R, SerializableObject>).data.forEach(
          (resourceData: any) => {
            this.decodeResource(
              Resource as any, // (1) This is odd, R (that extends AnyResource) seems to be incompatible with AnyResource
              resourceData,
              response.included, // TODO: fix
              resourceParameters.fields || EMPTY_OBJECT,
              resourceParameters.include || createDefaultIncludeParameters(this, Resource as any),
              EMPTY_ARRAY, // Use frozen array to catch property modifications
            )
              .mapSuccess((value) => {
                resources.push(value as R)
              })
              .mapFailure((value) => {
                errors.push(...value)
              })
          },
        )
        if (errors.length) {
          throw errors
        }
        return new ApiCollectionResult(resources, response.meta || {}, {} as any) as any
      },
    )
  }
}

class ApiError<T> extends Error {
  readonly value: T
  readonly pointer: ReadonlyArray<string>
  constructor(message: string, value: T, pointer: ReadonlyArray<string>) {
    super(message)
    this.value = value
    this.pointer = pointer
  }
}

class ApiResponseError extends ApiError<unknown> {
  name = 'Invalid JSON:API response'
}

class ApiValidationError extends ApiError<unknown> {
  name = 'Invalid JSON:API data'
}

type ResourcePatchValues<R extends AnyResource> = Partial<R>

export class ApiEndpoint<A extends AnyApiClient, R extends AnyResource> {
  client: A
  path: string
  Resource: ResourceConstructor<R>

  constructor(client: A, path: string, Resource: ResourceConstructor<R>) {
    this.client = client
    this.path = path
    this.Resource = Resource
    client.register(Resource)
  }

  async get<P extends ApiResourceParameters<R>>(
    resourceId: ResourceId,
    ResourceParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiEntityResult<FilteredResource<R, P>, JSONAPIMeta>> {
    return (this.client.getResourceEntity as PreventExcessivelyDeepRecursionError)(
      this.Resource,
      [this.path, resourceId].join('/'),
      ResourceParameters,
    )
  }

  async getToOneRelationship<
    N extends keyof ResourceToOneRelationshipFields<R>,
    P extends ApiResourceParameters<Extract<R[N], AnyResource>>
  >(
    resourceId: ResourceId,
    name: N & ResourceFieldName,
    ResourceRelationshipParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiEntityResult<FilteredResource<Extract<R[N], AnyResource>, P>, JSONAPIMeta>> {
    const field = this.client.getResourceField(this.Resource, name)
    if (!field.isToOneRelationshipField()) {
      throw new Error(`Field "${name}" must be a ${field.meta} relationship`)
    }
    const RelationshipResource = this.client.getResourceByType(field.type)
    const fieldURLPath = this.client.setup.transformRelationshipPath(name)

    // Api#getResourceEntity as any because ResourceRelationshipParameters
    return (this.client.getResourceEntity as any)(
      RelationshipResource,
      createURLPath(this.path, resourceId, fieldURLPath),
      ResourceRelationshipParameters,
    )
  }

  async getToManyRelationship<
    N extends keyof ResourceToManyRelationshipFields<R>,
    P extends ApiResourceParameters<R[N][any]>
  >(
    resourceId: ResourceId,
    name: N & ResourceFieldName,
    queryParameters: Nullable<ApiQueryParameters<A>> = null,
    ResourceRelationshipParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiCollectionResult<Array<FilteredResource<R[N][any], P>>, JSONAPIMeta>> {
    const field = this.client.getResourceField(this.Resource, name)
    if (!field.isToManyRelationshipField()) {
      throw new Error(`Field "${name}" must be a ${field.meta} relationship`)
    }
    const RelationshipResource = this.client.getResourceByType(field.type)
    const fieldURLPath = this.client.setup.transformRelationshipPath(name)
    // Api#getResourceCollection as any because ResourceRelationshipParameters
    return (this.client.getResourceCollection as any)(
      RelationshipResource,
      createURLPath(this.path, resourceId, fieldURLPath),
      queryParameters,
      ResourceRelationshipParameters,
    )
  }

  async getCollection<P extends ApiResourceParameters<R>>(
    queryParameters: Nullable<ApiQueryParameters<A>> = null,
    ResourceParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiCollectionResult<Array<FilteredResource<R, P>>, JSONAPIMeta>> {
    return (this.client.getResourceCollection as PreventExcessivelyDeepRecursionError)(
      this.Resource,
      this.path,
      queryParameters,
      ResourceParameters,
    )
  }

  async create(): Promise<BaseApiEntityResult<FilteredResource<R>, JSONAPIMeta>> {
    return new ApiEntityResult({} as any, {} as any)
  }

  update(resourceId: ResourceId, values: ResourcePatchValues<R>) {}

  delete(resourceId: ResourceId) {}
}

export type ApiQueryParameterArrayValue = Array<string | number>
export type ApiQueryParameterObjectValue = {
  [key: string]: ApiQueryParameterValue
}

export type ApiQueryParameterValue =
  | string
  | number
  | boolean
  | ApiQueryParameterArrayValue
  | ApiQueryParameterObjectValue

export type ApiQueryParameters<A extends AnyApiClient> = {
  [key: string]: ApiQueryParameterValue
} & {
  page?: Parameters<A['setup']['createPageQuery']>[0]
} & {
  include?: never
  fields?: never
}

export type ApiResourceParametersConstructor<P extends ApiResourceParameters<any>> = new () => P

export class ApiResourceParameters<R extends AnyResource> {
  fields?: ResourceFieldsParameter<R>
  include?: ResourceIncludeParameter<R>

  static isApiResourceParameters(value: unknown): value is ApiResourceParameters<any> {
    return value instanceof ApiResourceParameters
  }
}

// FILTER RESOURCE
type BaseFilteredByFieldsResource<R, F> = R extends AnyResource
  ? F extends Exclude<keyof R, ResourceIdentifierKey>
    ? Pick<R, F | ResourceIdentifierKey>
    : F extends undefined | null
    ? ResourceIdentifier<R['type']>
    : Warning<'Invalid Resource fields parameter', R, F> // TODO: use Api#setup to determine default included fields
  : never

type TestBaseFilteredByFieldsResource = BaseFilteredByFieldsResource<A, 'b'>

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
  : never

type Warning<T extends string, U, V> = { message: T; context: U; value: V }

type BaseFilteredResourceOfType<T, R, I, F> = T extends keyof F
  ? BaseFilteredByIncludesResource<BaseFilteredByFieldsResource<R, F[T][any]>, I, F>
  : BaseFilteredByIncludesResource<R, I, F>

type BaseFilteredResource<R, I, F> = R extends AnyResource
  ? UnionToIntersection<BaseFilteredResourceOfType<R['type'], R, I, F>>
  : never

type BaseFilteredToManyRelationship<R, I, F> = R extends Array<AnyResource>
  ? Array<BaseFilteredResource<R[number], I, F>>
  : never

type ResourcePrimaryIncludeFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends RelationshipValue ? null : never
  }
>

class ApiResult<R extends AnyResource | Array<AnyResource>, M extends SerializableObject> {
  data: R
  meta: M

  constructor(data: R, meta: M) {
    this.data = data
    this.meta = meta
  }
}

type BaseApiEntityResult<R, M> = { data: R; meta: M }

class ApiEntityResult<R extends AnyResource, M extends SerializableObject> extends ApiResult<
  R,
  M
> {}

type BaseApiCollectionResult<R, M> = { data: R; meta: M; page: BaseApiCollectionPageLinks<R, M> }

type BaseApiCollectionPageLinks<R, M> = {
  first(): BaseApiCollectionResult<R, M>
  prev(): BaseApiCollectionResult<R, M>
  next(): BaseApiCollectionResult<R, M>
  last(): BaseApiCollectionResult<R, M>
}

type ApiCollectionPageLinks<
  R extends Array<AnyResource>,
  M extends {}
> = BaseApiCollectionPageLinks<R, M>

// Should receive an ApiEndpoint, use its api.controller to map each 'links objects' value
// and prepare a method that may fetch the first/prev/next/last page. The ApiEndpoint types
// should not matter, as the exact Resource shape is already determined at this point.
// The resourceParameters should be used to decode the linked responses
const createPageMethodsFromLinksObject = <R extends Array<AnyResource>, M extends {}>(
  endpoint: ApiEndpoint<any, any>,
  resourceParameters: ApiResourceParameters<any>,
  links: any,
): ApiCollectionPageLinks<R, M> => {
  return {
    first(): any {},
    prev(): any {},
    next(): any {},
    last(): any {},
  } as any
}

const createURLPath = (...path: Array<string>): string => path.join('/')

class ApiCollectionResult<
  R extends Array<AnyResource>,
  M extends SerializableObject
> extends ApiResult<R, M> {
  page: ApiCollectionPageLinks<R, M>
  constructor(data: R, meta: M, page: ApiCollectionPageLinks<R, M>) {
    // TODO: remove any
    super(data, meta)
    this.page = page
  }
}

type FilteredIncludePrimaryResource<R extends AnyResource> = BaseFilteredResource<
  R,
  ResourcePrimaryIncludeFields<R>,
  {}
>

type FilteredIncludeNoneResource<R extends AnyResource> = BaseFilteredResource<R, {}, {}>

export type FilteredResource<
  R extends AnyResource,
  P extends ApiResourceParameters<R> = {}
> = BaseFilteredResource<R, P['include'], P['fields']>

const createDefaultIncludeParameters = (
  client: ApiClient<any>,
  Resource: ResourceConstructor<any>,
): ResourceIncludeParameter<AnyResource> => {
  return client.setup.defaultIncludedRelationships !== NONE
    ? getPrimaryRelationshipParameter(Resource)
    : EMPTY_OBJECT
}

const getPrimaryRelationshipParameter = <R extends AnyResource>(
  Resource: ResourceConstructor<R>,
): ResourcePrimaryIncludeFields<R> => {
  return Object.values(Resource.fields).reduce(
    (primaryRelationshipFields, resourceField) => {
      if (resourceField.isRelationshipField()) {
        ;(primaryRelationshipFields as any)[resourceField.name] = null
      }
      return primaryRelationshipFields
    },
    createEmptyObject() as ResourcePrimaryIncludeFields<R>,
  )
}

// DEMO RESOURCES
class A extends resource('a')<A> {
  xa?: string
  @toOneRelationship('b') b!: B | null
  @toManyRelationship('c') cs!: C[]
}

class B extends resource('b')<B> {
  @toOneRelationship('c') c!: C | null
}

class C extends resource('c')<C> {
  @requiredAttribute(isString) name!: string
  @toManyRelationship('d') ds!: D[]
}

class D extends resource('d')<D> {
  @toManyRelationship('e') es!: E[]
  @toOneRelationship('a') a!: A | null
}

class E extends resource('e')<E> {
  @toOneRelationship('f') f!: F | null
}

class F extends resource('f')<F> {
  xf!: string
}

type FilteredA = FilteredResource<A, { include: ResourcePrimaryIncludeFields<A> }>

// class AFilter extends ApiResourceParameters<A> {
//   fields = {
//     a: ['b', 'cs'],
//     c: ['ds'],
//     e: ['f'],
//     f: ['xf'],
//   } as const
//   include = {
//     b: {
//       c: {
//         ds: null,
//       },
//     },
//     cs: null,
//   }
// }

// const as = new ApiEndpoint(demoClient, 'as', A)

// as.get('12', AFilter).then((result) => {
//   result.data.b
// })

// const oi = apiX.getResourceEntity(as, 'as/12', AFilter).then((result) => {
//   result.data
//   return result.data
// })

// as.get('12', AFilter).then((result) => {
//   console.log(result)
// })

// class BFilter extends ApiResourceParameters<B> {
//   fields = {
//     c: ['ds'],
//   } as const
//   include = {
//     c: null,
//   }
// }

// as.getCollection(null, AFilter).then((result) => {
//   console.log(result.data)
// })

// as.getToOneRelationship('12', 'b', BFilter).then((result) => {
//   console.log(result.data)
// })

// class CFilter extends ApiResourceParameters<C> {
//   include = {
//     ds: null,
//   }
// }

// as.getToManyRelationship('12', 'cs', CFilter).then((result) => {
//   console.log(result.data)
// })

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

namespace JSONAPI {
  export const resourceOfType = resource
  export const Client = ApiClient
  export const Endpoint = ApiEndpoint
  export const Resource = ApiResource
  export const ResourceParameters = ApiResourceParameters
}

export default JSONAPI
