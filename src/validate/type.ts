import { Predicate, isObjectLike, at, isUndefined, isNull } from 'isntnt'

import { JSONAPIMetaObject } from '../types'

const cloneWith = <T extends {}, U extends {} = {}>(value: T, extension: U): T & U =>
  Object.assign(Object.create(Object.getPrototypeOf(value)), value, extension)

class TypeValidationError extends TypeError {
  readonly value: unknown
  readonly pointer: TypePointer
  readonly details: Array<TypeErrorDetails>

  constructor(type: Type<any>, value: unknown, details: Array<TypeErrorDetails> = []) {
    super(`Invalid Type: ${type}`)
    this.pointer = type.pointer
    this.value = value
    this.details = details
  }
}

export type StaticType<T extends Type<any>> = T extends Type<infer R> ? R : never

export type TypePointer = ReadonlyArray<PropertyKey>

export type TypeMeta<T> = TypeErrorDetails & {
  rules: Array<Type<T>>
}

export type TypeErrorDetails = {
  code: string | null
  description: string
  pointer: TypePointer
}

enum TypeAssertionMode {
  Intersection,
  Union,
}

enum TypeVerb {
  Is,
  Has,
  Includes,
}

const typeMustVerbMap: Record<TypeVerb, string> = ['be', 'have', 'include']
const typeEqualsVerbMap: Record<TypeVerb, string> = ['is', 'has', 'includes']

export default class Type<T> implements TypeMeta<T> {
  private readonly mode: TypeAssertionMode
  private readonly verb: TypeVerb

  readonly predicate: Predicate<T>
  readonly rules: Array<Type<T>> = []
  readonly code: string | null
  readonly description: string
  readonly pointer: TypePointer

  private constructor(
    predicate: Predicate<T>,
    mode: TypeAssertionMode,
    verb: TypeVerb,
    meta: TypeMeta<T>,
  ) {
    this.predicate = predicate
    this.mode = mode
    this.verb = verb
    this.rules = meta.rules
    this.code = meta.code
    this.description = meta.description
    this.pointer = meta.pointer
  }

  assert(value: unknown): T {
    const details = this.validate(value)
    if (details.length) {
      throw new TypeValidationError(this, value, details)
    }
    return value as T
  }

  validate(value: unknown): Array<TypeErrorDetails> {
    if (!this.predicate(value)) {
      return [
        {
          code: this.code,
          description: this.description,
          pointer: this.pointer,
        },
      ]
    }
    return this.rules.flatMap((type) => type.validate(value))
  }

  toString() {
    return (this.constructor as typeof Type).formatDetailedDescription(this)
  }

  withRules(rules: Array<Type<T>>): Type<T> {
    return cloneWith(this, { rules })
  }

  withPointer(pointer: TypePointer): Type<T> {
    return cloneWith(this, { pointer })
  }

  withLabel(label: string): Type<T> {
    return cloneWith(this, { label })
  }

  withDescription(description: string): Type<T> {
    return cloneWith(this, { description })
  }

  withCode(code: string | null): Type<T> {
    return cloneWith(this, { code })
  }

  with(values: Partial<TypeMeta<T>>): Type<T> {
    return cloneWith(this, values)
  }

  static null = Type.is('null', isNull)
  static undefined = Type.is('undefined', isUndefined)

  static is<T>(description: string, predicate: Predicate<T>): Type<T> {
    return new Type(predicate, TypeAssertionMode.Intersection, TypeVerb.Is, {
      description,
      rules: [],
      pointer: [],
      code: null,
    })
  }

  static has<T>(description: string, predicate: Predicate<T>): Type<T> {
    return new Type(predicate, TypeAssertionMode.Intersection, TypeVerb.Is, {
      description: description,
      rules: [],
      pointer: [],
      code: null,
    })
  }

  static includes<T>(description: string, predicate: Predicate<T>): Type<T> {
    return new Type(predicate, TypeAssertionMode.Intersection, TypeVerb.Is, {
      description,
      rules: [],
      pointer: [],
      code: null,
    })
  }

  static at<T extends PropertyKey, U>(key: T, type: Type<U>): Type<FormatObject<{ [P in T]: U }>> {
    return new Type(at(key, type.predicate) as any, type.mode, type.verb, {
      description: `an object where ${key} ${typeEqualsVerbMap[type.verb]} ${type.description}`,
      rules: type.rules.map((type) => Type.at(key, type)),
      pointer: [key],
      code: null,
    })
  }

  static shape<T extends TypeShape>(types: T): Type<StaticShapeType<T>> {
    const rules = Object.keys(types).map((key) => Type.at(key, types[key]))
    return new Type(isObjectLike as any, TypeAssertionMode.Intersection, TypeVerb.Is, {
      description: `an object`,
      rules: rules as any,
      pointer: [],
      code: null,
    })
  }

  static and<T>(types: Array<Type<T>>): Type<T> {
    const predicate = (value: unknown): value is T => types.every((type) => type.predicate(value))
    return new Type(predicate, TypeAssertionMode.Intersection, TypeVerb.Is, {
      description: this.formatAndDescription(types),
      rules: types,
      pointer: [],
      code: null,
    })
  }

  static or<T extends Type<any>>(types: Array<T>): Type<StaticType<T>> {
    const predicate = (value: unknown): value is T => types.some((type) => type.predicate(value))
    return new Type(predicate, TypeAssertionMode.Intersection, TypeVerb.Is, {
      description: this.formatAndDescription(types),
      rules: types,
      pointer: [],
      code: null,
    })
  }

  static formatOrDescription(types: Array<Type<any>>): string {
    const descriptions = types.map(
      (type) => `must ${typeMustVerbMap[type.verb]} ${type.description}`,
    )
    return typeDescriptionFormatter(descriptions, 'or')
  }

  static formatAndDescription(types: Array<Type<any>>): string {
    const descriptions = types.map(
      (type) => `must ${typeMustVerbMap[type.verb]} ${type.description}`,
    )
    return typeDescriptionFormatter(descriptions, 'and')
  }

  static formatDetailedDescription(type: Type<any>): string {
    const pointer = type.pointer.join('/')
    return `value ${pointer ? ` at ${pointer}` : ' '}${typeMustVerbMap[type.verb]}${
      type.description
    }`
  }
}

const typeDescriptionFormatter = (descriptions: Array<string>, delimiter: 'or' | 'and'): string => {
  switch (descriptions.length) {
    case 0:
      return ''
    case 1:
      return descriptions[0]
    case 2:
      return descriptions.join(` ${delimiter} `)
    default:
      return [descriptions.slice(0, -1).join(', '), `${delimiter} ${descriptions.slice(-1)}`].join(
        `, `,
      )
  }
}

type TypeShape = { [key: string]: Type<any> }

type StaticShapeType<T extends TypeShape> = FormatObject<
  {
    [P in keyof T]: StaticType<T[P]>
  }
>

type FormatObject<T> = {
  [P in RequiredObjectKey<T>]: T[P]
} &
  {
    [P in OptionalObjectKey<T>]?: T[P]
  }

type RequiredObjectKey<T extends {}> = Exclude<
  {
    [P in keyof T]: Extract<T[P], undefined> extends never ? P : never
  }[keyof T],
  undefined
>

type OptionalObjectKey<T extends {}> = Exclude<
  {
    [P in keyof T]: Extract<T[P], undefined> extends never ? never : P
  }[keyof T],
  undefined
>

type ResourceValidationErrorDetail = {
  code: string | null
  title: string
  source: {
    pointer: Array<string>
  }
}

type ResourceRequestErrorDetail = {
  id: string | null
  code: string | null
  title: string | null
  detail: string | null
  status: string | null
  source: {
    pointer: Array<string>
    parameter: string | null
  }
  meta: JSONAPIMetaObject
}

type ResourceErrorDetail = ResourceValidationErrorDetail | ResourceRequestErrorDetail

class JSONAPIError<T extends ResourceErrorDetail> extends Error {
  readonly details: Array<T>
  readonly value: unknown

  constructor(message: string, value: unknown, details: Array<T>) {
    super(message)
    this.value = value
    this.details = details
  }
}

class ClientResponseError extends JSONAPIError<ResourceRequestErrorDetail> {
  constructor(response: Response, data: unknown) {
    super(response.statusText, data, [])
  }
}

class ResourceValidationError extends JSONAPIError<ResourceValidationErrorDetail> {
  constructor(type: Type<any>, value: unknown) {
    super(String(type), value, [])
  }
}

type Validator<T> = (value: unknown) => Array<string>
