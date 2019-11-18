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
  isUndefined,
  or,
  array,
  either,
  isArray,
} from 'isntnt'
import { createEmptyObject } from './src/utils/data'
import { ok, error, Result } from './Result'

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

type NonEmptyArray<T> = Array<T> & { 0: T }
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

const FIELDS = 'fields' as const
const INCLUDE = 'include' as const

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

export type AttributeValue = OptionalAttributeValue | RequiredAttributeValue
export type OptionalAttributeValue = RequiredAttributeValue | undefined
export type RequiredAttributeValue =
  | SerializablePrimitive
  | SerializableArray
  | (SerializableObject & {
      relationships?: never
      fields?: never
    })

export type RelationshipValue = ToOneRelationshipValue | ToManyRelationshipValue
export type ToOneRelationshipValue = Nullable<AnyResource>
export type ToManyRelationshipValue = Array<AnyResource>

// RESOURCE FIELD
type ResourceFieldPointer<R extends ResourceFieldRoot, N extends ResourceFieldName> = [
  typeof DATA,
  R,
  N,
]

type AnyResourceField =
  | ResourceAttributeField<ResourceAttributeFieldMeta, ResourceFieldName, AttributeValue>
  | ResourceRelationshipField<ResourceRelationshipFieldMeta, ResourceFieldName, RelationshipValue>

export type ResourceAttributeField<
  M extends ResourceAttributeFieldMeta,
  N extends ResourceFieldName,
  T extends AttributeValue
> = ResourceField<ResourceAttributesFieldRoot, M, N, T>

export type ResourceOptionalAttributeField<
  N extends ResourceFieldName,
  T extends OptionalAttributeValue
> = ResourceAttributeField<ResourceOptionalAttributeFieldMeta, N, T | undefined>

export type ResourceRequiredAttributeField<
  N extends ResourceFieldName,
  T extends RequiredAttributeValue
> = ResourceAttributeField<ResourceRequiredAttributeFieldMeta, N, T>

export type ResourceRelationshipField<
  M extends ResourceRelationshipFieldMeta,
  N extends ResourceFieldName,
  R extends RelationshipValue
> = ResourceField<ResourceRelationshipsFieldRoot, M, N, R>

export type ResourceToOneRelationshipField<
  N extends ResourceFieldName,
  R extends ToOneRelationshipValue
> = ResourceRelationshipField<ResourceToOneRelationshipFieldMeta, N, R>

export type ResourceToManyRelationshipField<
  N extends ResourceFieldName,
  R extends ToManyRelationshipValue
> = ResourceRelationshipField<ResourceToManyRelationshipFieldMeta, N, R>

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

export type ResourceFieldModel = {
  [key: string]: ResourceFieldValue
} & {
  type?: never
  id?: never
}

// RESOURCE IDENTIFIER OBJECT
export type AnyResourceIdentifier = ResourceIdentifier<ResourceType>
export type ResourceIdentifierKey = keyof AnyResourceIdentifier

export class ResourceIdentifier<T extends string> {
  // [Symbol.species]: ResourceSpecies = ResourceIdentifier
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
export type AnyResource = Resource<ResourceType, Record<string, ResourceFieldValue>>

export type ResourceToOneRelationship<R extends AnyResource> = Nullable<R>
export type ResourceToOneRelationshipIdentifier<R extends AnyResource> = Nullable<
  ResourceIdentifier<R['type']>
>

export type ResourceToManyRelationship<R extends AnyResource> = Array<R>
export type ResourceToManyRelationshipIdentifier<R extends AnyResource> = Array<
  ResourceIdentifier<R['type']>
>

export class Resource<
  T extends ResourceType,
  F extends ResourceFieldModel
> extends ResourceIdentifier<T> {
  // [Symbol.species]: ResourceSpecies = Resource

  constructor(values: Resource<T, F>) {
    super(values.type, values.id)
    Object.assign(this, values)
  }

  static type: ResourceType
  static fields: Record<ResourceFieldName, AnyResourceField> = createEmptyObject()
}

type ResourceAttributeFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends RelationshipValue ? never : ResourceAttributeField<any, any, any>
  }
>

type ResourceRelationshipFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends RelationshipValue
      ? ResourceRelationshipField<any, any, any>
      : never
  }
>

type ResourceToOneRelationshipFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends ToOneRelationshipValue
      ? ResourceToOneRelationshipField<any, any>
      : never
  }
>

type ResourceToManyRelationshipFields<R extends AnyResource> = WithoutNever<
  {
    [K in keyof R]: R[K] extends ToManyRelationshipValue
      ? ResourceToManyRelationshipField<any, any>
      : never
  }
>

type ResourceFields<R extends AnyResource> = {
  [K in keyof R]: R[K] extends RelationshipValue
    ? ResourceRelationshipField<any, any, any>
    : ResourceAttributeField<any, any, any>
}

export type ResourceConstructor<R extends AnyResource> = {
  new (resource: R): R
  type: R['type']
  fields: Record<ResourceFieldName, AnyResourceField>
}

export const resource = <T extends string>(type: T) => {
  return class extends Resource<T, ResourceFieldModel> {
    static type: T = type
    static fields: Record<ResourceFieldName, AnyResourceField> = createEmptyObject()
  }
}

type ResourceIncludeParameter<R extends AnyResource> = BaseResourceIncludeThree<R>

type ResourceFieldsParameter<R extends AnyResource> = Partial<
  UnionToIntersection<BaseResourceFieldsUnion<R>>
>

// RESPONSE DATA
type JSONAPIVersion = '1.0' | '1.1'
type JSONAPIMeta = SerializableObject

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

type BaseResourceFieldOptions<T> = T extends AnyResource
  ? {
      [K in T['type']]: ReadonlyNonEmptyArray<BaseResourceFieldNames<T>>
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

type ApiSetup<S extends Partial<ApiSetupOptions>> = {
  [K in keyof DefaultApiSetup]: K extends keyof S ? S[K] : DefaultApiSetup[K]
}

type ApiSetupOptions = {
  version: JSONAPIVersion
  defaultIncludedRelationships: ApiDefaultIncludedFields
  fetchAdapter: Fetch
  beforeRequest(request: Request): Request
  transformRelationshipPath(name: ResourceFieldName): ResourceFieldName
}

type DefaultApiSetup = ApiSetupOptions & {
  version: '1.0'
  defaultIncludedRelationships: typeof NONE
}

const defaultApiSetup: DefaultApiSetup = {
  version: '1.0',
  defaultIncludedRelationships: NONE,
  fetchAdapter: window.fetch,
  beforeRequest(request: Request): Request {
    return request
  },
  transformRelationshipPath(name: ResourceFieldName): ResourceFieldName {
    return name
  },
}

type AnyApi = Api<ApiSetupOptions>

class Api<S extends ApiSetup<any>> {
  url: URL
  setup: S
  resources: Record<ResourceType, ResourceConstructor<AnyResource>> = createEmptyObject()

  constructor(url: URL, setup: Partial<S> = EMPTY_OBJECT) {
    this.url = url
    this.setup = { ...defaultApiSetup, ...setup } as any
  }

  registerResource(Resource: ResourceConstructor<any>): void {
    if (Resource.type in this.resources && Resource !== this.resources[Resource.type]) {
      console.warn(`Attempt to replace Resource of type ${Resource.type}`)
    }
    this.resources[Resource.type] = Resource
  }

  getResourceByType(type: ResourceType): ResourceConstructor<any> {
    const Resource = this.resources[type]
    if (isUndefined(Resource)) {
      throw new Error(`Resource of type "${type}" does not exist on Api`)
    }
    return Resource
  }

  async handleFetchRequest<R extends AnyResource | Array<AnyResource>, M extends JSONAPIMeta>(
    url: URL,
    options: FetchOptions,
  ): Promise<ApiSuccessResponse<R, M>> {
    const fetchAdapter: Fetch = this.setup.fetchAdapter
    const request = this.setup.beforeRequest(new Request(url.href, options))
    return fetchAdapter(request)
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json()
      })
      .then((body) => {
        if ('errors' in body) {
          // TODO: parse body errors
          throw new Error(`Found ${body.errors.length} errors in response`)
        }
        return body
      })
  }

  decodeIncludedResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    identifier: ResourceIdentifier<R['type']>,
    included: BaseApiResponseIncludedResources | undefined,
    fieldsParameter: ResourceFieldsParameter<R>,
    includeParameter: ResourceIncludeParameter<R>,
    pointer: ReadonlyArray<string>,
  ): Result<R, Error> {
    if (isUndefined(included)) {
      return error(new Error(`Missing included resource data`))
    }
    const data = included.find(
      (includedData) => includedData.type === identifier.type && includedData.id === identifier.id,
    )
    if (isUndefined(data)) {
      return error(
        new Error(
          `Could not find included Resource of type "${Resource.type}" with id "${identifier.id}"`,
        ),
      )
    }
    return (this.decodeResource as PreventExcessivelyDeepRecursionError)(
      Resource,
      data,
      included,
      fieldsParameter,
      includeParameter,
      pointer.concat(identifier.id),
    )
  }

  decodeResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    data: ApiResponseResourceData<R>,
    included: BaseApiResponseIncludedResources | undefined,
    fieldsParameter: ResourceFieldsParameter<R>,
    includeParameter: ResourceIncludeParameter<R>,
    pointer: ReadonlyArray<string>,
  ): Result<R, Error> {
    if (!isObject(data)) {
      return error(new Error(`Invalid data`))
    }

    // TODO: should the data of a resource be added to the included data because
    // a relationship MAY depend on it?
    if (isArray(included)) {
      included.push(data)
    }

    const resource: Record<ResourceFieldName, ResourceFieldValue> = createEmptyObject()
    const fieldNames: Array<ResourceFieldNames<R>> =
      (fieldsParameter as any)[Resource.type] || Object.keys(Resource.fields)

    if (data.type === Resource.type) {
      resource.type = data.type
    } else {
      return error(new Error(`Invalid resource type`))
    }

    if (isString(data.id)) {
      resource.id = data.id
    } else {
      return error(new Error(`Invalid resource id`))
    }

    fieldNames.forEach(<N extends ResourceFieldName>(name: N) => {
      const field = Resource.fields[name]
      const root = data[field.root]
      if (isObject(root)) {
        if (field.name in root) {
          const value = (root as any)[field.name] // WTF?

          if (field.isAttributeField()) {
            if (field.validate(value)) {
              resource[name] = value
            } else if (isUndefined(value)) {
              if (field.isRequiredAttributeField()) {
                return error(new Error(`Invalid data: "${field.name}" is a required field`))
              }
            } else {
              return error(new Error(`Invalid data: "${field.name}" does not match its predicate`))
            }
          }

          if (!field.validate(value.data)) {
            return error(
              new Error(`Invalid data: "${field.name}" must be a ${field.meta} relationship value`),
            )
          }

          if (field.isToOneRelationshipField()) {
            if (isNull(value)) {
              resource[name] = value
            } else {
              const RelationshipResource = this.getResourceByType(value.type)
              const relationshipIncludeParameter = (includeParameter as any)[name] || EMPTY_OBJECT
              const result: Result<AnyResource, Error> = (this.decodeIncludedResource as any)(
                RelationshipResource,
                value,
                included,
                fieldsParameter,
                relationshipIncludeParameter,
                pointer.concat(field.pointer),
              )
              if (result.isOK()) {
                resource[name] = result.value
              } else {
                return error(new Error(`Invalid resource relationship at "${field.name}"`))
              }
            }
          } else if (field.isToManyRelationshipField()) {
            const resources: Array<AnyResource> = []
            const errors = []
            value.forEach((identifier: AnyResourceIdentifier) => {
              const RelationshipResource = this.getResourceByType(value.type)
              const relationshipIncludeParameter = (includeParameter as any)[name] || EMPTY_OBJECT
              const result: Result<AnyResource, Error> = (this.decodeIncludedResource as any)(
                RelationshipResource,
                identifier,
                included,
                fieldsParameter,
                relationshipIncludeParameter,
                pointer.concat(field.pointer),
              )
              if (result.isOK()) {
                resources.push(result.value)
              } else {
                errors.push(new Error(`Invalid resource relationship at "${field.name}"`))
              }
            })
            if (errors.length) {
              return error(`Found ${errors.length} invalid resources in to-many relationship`)
            } else {
              resource[name] = resources
            }
          }
        }
      }
    })

    return ok(new Resource(resource as any))
  }

  async getResourceEntity<
    R extends AnyResource,
    M extends JSONAPIMeta,
    P extends ApiResourceParameters<R>
  >(
    endpoint: ApiEndpoint<this, R>,
    resourcePath: string,
    ResourceParameters: new () => P,
  ): Promise<BaseApiEntityResult<FilteredResource<R, P>, M>> {
    const url = new URL(resourcePath, this.url) // TODO: add search params to url
    const resourceParameters = new ResourceParameters()

    return this.handleFetchRequest<R, M>(url, {} /* TODO: add options */).then((response) => {
      return this.decodeResource(
        endpoint.Resource as any, // (1) This is odd, R (that extends AnyResource) seems to be incompatible with AnyResource
        response.data,
        response.included,
        resourceParameters.fields || (EMPTY_OBJECT as any),
        resourceParameters.include || createDefaultIncludeParameters(endpoint),
        EMPTY_ARRAY, // Use frozen array to catch property modifications
      )
        .map((resource: AnyResource) => {
          // AnyResource Should be R, see 1
          return new ApiEntityResult(resource, response.meta || {})
        })
        .unwrap() as any // See 1
    })
  }

  async getResourceCollection<
    R extends AnyResource,
    M extends JSONAPIMeta,
    P extends ApiResourceParameters<R>
  >(
    endpoint: ApiEndpoint<this, R>,
    resourcePath: string,
    ResourceParameters: new () => P,
  ): Promise<BaseApiCollectionResult<FilteredResource<R, P>[], M>> {
    const url = new URL(resourcePath, this.url) // TODO: add search params to url
    const resourceParameters = new ResourceParameters()

    return this.handleFetchRequest<R[], M>(url, {} /* TODO: add options */).then((response) => {
      const resources: Array<R> = []
      const errors: Array<Error> = []
      ;(response as ApiResourceCollectionResponse<R, M>).data.forEach((resourceData: any) => {
        const result = this.decodeIncludedResource(
          endpoint.Resource as any, // (1) This is odd, R (that extends AnyResource) seems to be incompatible with AnyResource
          resourceData,
          response.included as any, // TODO: fix
          resourceParameters.fields || (EMPTY_OBJECT as any),
          resourceParameters.include || createDefaultIncludeParameters(endpoint),
          EMPTY_ARRAY, // Use frozen array to catch property modifications
        )
        if (result.isOK()) {
          resources.push(result.value as R)
        } else {
          errors.push(result.value)
        }
      })
      if (errors.length) {
        throw new Error(`Found ${errors.length} errors`)
      }
      return new ApiCollectionResult(resources, response.meta || {}, {} as any) as any
    })
  }
}

const urlX = new URL('https://example.com/')

const apiX = new Api(urlX, {
  version: '1.0',
  defaultIncludedRelationships: 'primary',
})

type ResourcePatchValues<R extends AnyResource> = Partial<R>

class ApiEndpoint<A extends AnyApi, R extends AnyResource> {
  api: A
  path: string
  Resource: ResourceConstructor<R>

  constructor(api: A, path: string, Resource: ResourceConstructor<R>) {
    this.api = api
    this.path = path
    this.Resource = Resource
  }

  async get<P extends ApiResourceParameters<R>, M extends JSONAPIMeta>(
    resourceId: ResourceId,
    ResourceParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiEntityResult<FilteredResource<R, P>, M>> {
    return (this.api.getResourceEntity as PreventExcessivelyDeepRecursionError)(
      this,
      resourceId,
      ResourceParameters,
    )
  }

  async getToOneRelationship<
    N extends keyof ResourceToOneRelationshipFields<R>,
    P extends ApiResourceParameters<Extract<R[N], AnyResource>>
  >(
    resourceId: ResourceId,
    toOneRelationshipFieldName: N,
    ResourceRelationshipParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiEntityResult<FilteredResource<Extract<R[N], AnyResource>, P>, any>> {
    return (this.api.getResourceEntity as PreventExcessivelyDeepRecursionError)(
      this,
      `${resourceId}/${this.api.setup.transformRelationshipPath(
        toOneRelationshipFieldName as string,
      )}`,
      ResourceRelationshipParameters,
    )
  }

  async getToManyRelationship<
    N extends keyof ResourceToManyRelationshipFields<R>,
    P extends ApiResourceParameters<R[N][any]>
  >(
    resourceId: ResourceId,
    toManyRelationshipFieldName: N,
    ResourceRelationshipParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiCollectionResult<Array<FilteredResource<R[N][any], P>>, {}>> {
    return (this.api.getResourceEntity as PreventExcessivelyDeepRecursionError)(
      this,
      `${resourceId}/${this.api.setup.transformRelationshipPath(
        toManyRelationshipFieldName as string,
      )}`,
      ResourceRelationshipParameters,
    )
  }

  async getCollection<P extends ApiResourceParameters<R>>(
    queryParameters: Nullable<ApiQueryParameters> = null,
    ResourceParameters: new () => P = ApiResourceParameters as any,
  ): Promise<BaseApiCollectionResult<Array<FilteredResource<R, P>>, {}>> {
    return new ApiCollectionResult({} as any, {} as any, {} as any)
  }

  async create(): Promise<BaseApiEntityResult<FilteredResource<R>, {}>> {
    return new ApiEntityResult({} as any, {} as any)
  }

  update(resourceId: ResourceId, values: ResourcePatchValues<R>) {}

  delete(resourceId: ResourceId) {}
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

type ApiResourceParametersConstructor<P extends ApiResourceParameters<any>> = new () => P

class ApiResourceParameters<R extends AnyResource> {
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
  ? BaseFilteredResourceOfType<R['type'], R, I, F>
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

type NoneIncludedA = FilteredIncludePrimaryResource<A>

type FilteredResource<
  R extends AnyResource,
  P extends ApiResourceParameters<R> = {}
> = BaseFilteredResource<R, P['include'], P['fields']>

class AFilter extends ApiResourceParameters<A> {
  fields = {
    a: ['b'],
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

const createDefaultIncludeParameters = <E extends ApiEndpoint<any, any>>(
  endpoint: E,
): ResourceIncludeParameter<AnyResource> => {
  return endpoint.api.setup.defaultIncludedRelationships === PRIMARY
    ? getPrimaryRelationshipParameter(endpoint.Resource)
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

type FilteredA = FilteredResource<A, { include: ResourcePrimaryIncludeFields<A> }>

const as = new ApiEndpoint(apiX, 'as', A)

const oi = apiX.getResourceEntity(as, 'as/12', AFilter).then((result) => {
  result.data
  return result.data
})

as.get('12', AFilter).then((result) => {
  console.log(result)
})

class BFilter extends ApiResourceParameters<B> {
  fields = {
    c: ['ds'],
  } as const
  include = {
    c: null,
  }
}

as.getCollection(null, AFilter).then((result) => {
  console.log(result.data)
})

as.getToOneRelationship('12', 'b', BFilter).then((result) => {
  console.log(result.data)
})

class CFilter extends ApiResourceParameters<C> {
  include = {
    ds: null,
  }
}

as.getToManyRelationship('12', 'cs', CFilter).then((result) => {
  console.log(result.data)
})

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
