import {
  at,
  isNull,
  isObject,
  isString,
  isUndefined,
  literal,
  None,
  Predicate,
  SerializablePrimitive,
  isFunction,
  Constructor,
  instance,
} from 'isntnt'

export type StaticType<T extends Type<any>> = T extends Type<infer R> ? R : never

export type TypePointer = ReadonlyArray<PropertyKey>

export type TypeMeta = {
  code: string | null
  description: string
  pointer: TypePointer
}

export type TypeErrorDetails = {
  code: string | null
  detail: string
  pointer: TypePointer
}

enum TypeAssertionMode {
  Intersection,
  Union,
}

const assertionModeDetailMap: Record<TypeAssertionMode, string> = ['and', 'or']

export default class Type<T> implements TypeMeta {
  private readonly mode: TypeAssertionMode
  readonly predicate: Predicate<T>
  readonly rules: Array<Type<T>> = []
  readonly code: string | null
  readonly description: string
  readonly pointer: TypePointer

  private constructor(
    predicate: Predicate<T>,
    rules: Array<Type<T>>,
    mode: TypeAssertionMode,
    meta: TypeMeta,
  ) {
    this.predicate = predicate
    this.rules = rules
    this.mode = mode
    this.code = meta.code
    this.description = meta.description
    this.pointer = meta.pointer
  }

  assert(value: any): asserts value is T {
    if (!this.predicate(value)) {
      throw new TypeError(String(this))
    }
  }

  parse(value: unknown): T {
    if (!this.predicate(value)) {
      throw new TypeError(String(this))
    }
    return value as T
  }

  async resolve(value: unknown): Promise<T> {
    return this.parse(value)
  }

  validate(value: unknown): ReadonlyArray<string> {
    switch (this.mode) {
      case TypeAssertionMode.Union: {
        return this.predicate(value) ? [] : [String(this)]
      }
      case TypeAssertionMode.Intersection: {
        return this.rules
          .filter((rule) => !rule.predicate(value))
          .flatMap((rule) => rule.validate(value))
      }
    }
  }

  with(meta: Partial<TypeMeta>): Type<T> {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, meta)
  }

  withCode(code: string | null): Type<T> {
    return this.with({ code })
  }

  withDescription(description: string): Type<T> {
    return this.with({ description })
  }

  withPointer(pointer: TypePointer): Type<T> {
    return this.with({ pointer })
  }

  toString(): string {
    const pointer = this.pointer.join('/')
    return `Value${pointer ? ` at ${pointer} ` : ` `}must be ${this.description}${
      this.code ? ` (${this.code})` : ''
    }`
  }

  static null = Type.is('null', isNull)
  static undefined = Type.is('undefined', isUndefined)
  static function = Type.is('a function', isFunction as Predicate<(...rest: any) => any>)
  static object = Type.is('an object', isObject)

  static is<T>(description: string, predicate: Predicate<T>): Type<T> {
    return new Type(predicate, [], TypeAssertionMode.Union, {
      description,
      pointer: [],
      code: null,
    })
  }

  static literal<T extends SerializablePrimitive>(literalValue: T): Type<T> {
    const description = isString(literalValue) ? `"${literalValue}"` : String(literalValue)
    return Type.is(description, literal(literalValue))
  }

  static either<T extends ReadonlyArray<SerializablePrimitive>>(
    ...literalValues: T
  ): Type<T[number]> {
    return Type.or(literalValues.map((literalValue) => Type.literal(literalValue)))
  }

  static instance<T extends Constructor<any, any>>(constructor: T): Type<InstanceType<T>> {
    return Type.is(`an instance of ${constructor.name}`, instance(constructor))
  }

  static at<T extends PropertyKey, U>(
    key: T,
    type: Type<U>,
  ): Type<InferredPartial<{ [P in T]: U }>> {
    const rules = type.rules.map((type) => Type.at(key, type))
    return new Type(at(key, type.predicate) as any, rules, type.mode, {
      description: type.description,
      pointer: type.pointer.concat([key]),
      code: type.code,
    })
  }

  static shape<T extends TypeShape>(description: string, types: T): Type<StaticShapeType<T>> {
    const rules = [Type.object, ...Object.keys(types).map((key) => Type.at(key, types[key]))]
    const predicate = (value: unknown) => rules.every((type) => type.predicate(value))

    return new Type(predicate as any, rules, TypeAssertionMode.Intersection, {
      description,
      code: null,
      pointer: [],
    }) as any
  }

  static and<T>(types: Array<Type<T>>): Type<T> {
    const rules = flattenAndRules(types)
    switch (rules.length) {
      case 0:
        throw new Error(`Type#and must contain at least 1 type`)
      case 1:
        return types[0]
      default: {
        const predicate = (value: unknown): value is T =>
          rules.every((rule) => rule.predicate(value))
        return new Type(predicate, rules, TypeAssertionMode.Intersection, {
          description: typeDescriptionFormatter(rules, TypeAssertionMode.Intersection),
          pointer: [],
          code: null,
        })
      }
    }
  }

  static or<T extends Type<any>>(types: Array<T>): Type<StaticType<T>> {
    const rules = flattenOrRules(types)
    switch (rules.length) {
      case 0:
        throw new Error(`Type#or must contain at least 1 type`)
      case 1:
        return rules[0]
      default: {
        const predicate = (value: unknown): value is T =>
          rules.some((type) => type.predicate(value))
        return new Type(predicate, types, TypeAssertionMode.Union, {
          description: typeDescriptionFormatter(rules, TypeAssertionMode.Union),
          pointer: [],
          code: null,
        })
      }
    }
  }

  static optional<T>(type: Type<T>): Type<T | undefined> {
    return Type.or([type, Type.undefined])
  }

  static nullable<T>(type: Type<T>): Type<T | null> {
    return Type.or([type, Type.null])
  }

  static maybe<T>(type: Type<T>): Type<T | None> {
    return Type.or([type, Type.null, Type.undefined])
  }
}

const typeDescriptionFormatter = (types: Array<Type<any>>, mode: TypeAssertionMode): string => {
  const descriptions = types.map((type) => type.description)
  const delimiter = assertionModeDetailMap[mode]
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

const flattenAndRules = (types: Array<Type<any>>, result: Array<Type<any>> = []) => {
  types.forEach((type) => {
    if ((type as any).mode === TypeAssertionMode.Intersection && type.rules.length) {
      flattenAndRules(type.rules, result)
    } else if (!result.includes(type)) {
      result.push(type)
    }
  })
  return result
}

const flattenOrRules = (types: Array<Type<any>>, result: Array<Type<any>> = []) => {
  types.forEach((type) => {
    if ((type as any).mode === TypeAssertionMode.Union && type.rules.length) {
      flattenOrRules(type.rules, result)
    } else if (!result.includes(type)) {
      result.push(type)
    }
  })
  return result
}

type TypeShape = { [key: string]: Type<any> }

type StaticShapeType<T extends TypeShape> = InferredPartial<
  {
    [P in keyof T]: StaticType<T[P]>
  }
>

type InferredPartial<T> = {
  [P in RequiredKey<T>]: T[P]
} &
  {
    [P in OptionalKey<T>]?: T[P]
  }

type RequiredKey<T extends {}> = Exclude<
  {
    [P in keyof T]: Extract<T[P], undefined> extends never ? P : never
  }[keyof T],
  undefined
>

type OptionalKey<T extends {}> = Exclude<
  {
    [P in keyof T]: Extract<T[P], undefined> extends never ? never : P
  }[keyof T],
  undefined
>
