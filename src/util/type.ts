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
  array,
} from 'isntnt'

export type StaticType<T extends Type<any>> = T extends Type<infer R> ? R : never

export type TypePointer = ReadonlyArray<PropertyKey>

export type TypeMeta = {
  code: string | null
  label: string | null
  description: string
  pointer: TypePointer
}

export type TypeErrorDetails = {
  code: string | null
  detail: string
  pointer: TypePointer
}

enum TypeAssertionMode {
  Intersect,
  Union,
}

const assertionModeDetailMap: Record<TypeAssertionMode, string> = ['and', 'or']

export class Type<T> implements TypeMeta {
  private readonly mode: TypeAssertionMode
  readonly predicate: Predicate<T>
  readonly rules: Array<Type<T>> = []
  readonly code: string | null
  readonly label: string | null
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
    this.label = meta.label
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
      case TypeAssertionMode.Intersect: {
        return this.rules
          .filter((rule) => !rule.predicate(value))
          .flatMap((rule) => rule.validate(value))
      }
      default: {
        throw new Error(`Type context must be bound`)
      }
    }
  }

  with(meta: Partial<TypeMeta>): Type<T> {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, meta)
  }

  withCode(code: string | null): Type<T> {
    return this.with({ code })
  }

  withLabel(label: string | null): Type<T> {
    return this.with({ label })
  }

  withDescription(description: string): Type<T> {
    return this.with({ description })
  }

  withPointer(pointer: TypePointer): Type<T> {
    return this.with({ pointer })
  }

  toString(): string {
    const label = this.label || 'Value'
    const pointer = this.pointer.join('/')
    return `${label}${pointer ? ` at ${pointer} ` : ` `}must be ${this.description}${
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
      label: null,
      code: null,
      pointer: [],
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
      label: null,
      code: type.code,
      pointer: type.pointer.concat([key]),
    })
  }

  static shape<T extends TypeShape>(description: string, types: T): Type<StaticShapeType<T>> {
    const rules = [Type.object, ...Object.keys(types).map((key) => Type.at(key, types[key]))]
    const predicate = (value: unknown) => rules.every((type) => type.predicate(value))

    return new Type(predicate as any, rules, TypeAssertionMode.Intersect, {
      description,
      label: null,
      code: null,
      pointer: [],
    }) as any
  }

  static array<T>(type: Type<T>): Type<Array<T>> {
    const rules = type.rules.map((type) => array(type.predicate))
    return new Type(array(type.predicate), [], TypeAssertionMode.Union, {
      description: `an Array where each element is ${type.description}`,
      label: null,
      code: null,
      pointer: [],
    })
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
        return new Type(predicate, rules, TypeAssertionMode.Intersect, {
          description: typeDescriptionFormatter(rules, TypeAssertionMode.Intersect),
          label: null,
          code: null,
          pointer: [],
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
          label: null,
          code: null,
          pointer: [],
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
  switch (descriptions.length) {
    case 0:
      return ''
    case 1:
      return descriptions[0]
    case 2:
      return descriptions.join(` ${assertionModeDetailMap[mode]} `)
    default: {
      return [
        descriptions.slice(0, -1).join(', '),
        `${assertionModeDetailMap[mode]} ${descriptions.slice(-1)}`,
      ].join(', ')
    }
  }
}

const flattenAndRules = (types: Array<Type<any>>, result: Array<Type<any>> = []) => {
  types.forEach((type) => {
    if ((type as any).mode === 'intersect' && type.rules.length) {
      flattenAndRules(type.rules, result)
    } else if (!result.includes(type)) {
      result.push(type)
    }
  })
  return result
}

const flattenOrRules = (types: Array<Type<any>>, result: Array<Type<any>> = []) => {
  types.forEach((type) => {
    if ((type as any).mode === 'union' && type.rules.length) {
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
