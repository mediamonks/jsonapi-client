import { Intersect, Predicate, Serializable } from 'isntnt'
import { event, stream } from './example/resources'

export type AttributeFieldValidator<T> = {
  predicate: Predicate<T>
  validate: (value: unknown) => ReadonlyArray<string>
}

export class Type<T> {
  readonly validate: (value: unknown) => ReadonlyArray<string>
  constructor(readonly predicate: Predicate<T>) {
    this.validate = {} as any
  }

  static is<T>(description: string, predicate: Predicate<T>): Type<T> {
    return { description, predicate } as any
  }

  static either<T>(...literalValues: ReadonlyArray<T>): Type<T> {
    return { literalValues } as any
  }
  
  static shape<T>(x: any, y: any): Type<T> {
    return { x, y } as any 
  }

  static optional<T>(x: Type<T>): Type<T | undefined> {
    return { x } as any 
  }

  static array<T>(x: Type<T>): Type<Array<T>> {
    return { x } as any 
  }

  static maybe<T>(x: Type<T>): Type<Array<T>> {
    return { x } as any 
  }

  static or<T extends Array<Type<T>>>(x: T): T[number] {
    return { x } as any 
  }
}

export type ResourceId = string

export type ResourceType = string

export type ResourceFieldName = string

export type ResourceFieldRoot = 'attributes' | 'relationships'

export enum ResourceFieldAction {
  Read,
  Create,
  Update,
}

export enum ResourceFieldRule {
  Forbidden,
  Required,
  Optional,
}

export type ResourceFieldRules = [read: ResourceFieldRule, write: ResourceFieldRule, update: ResourceFieldRule]

export type AttributeValue = Serializable

export abstract class ResourceField<T extends ResourceFieldRoot, U extends ResourceFieldRules> {
  constructor(readonly root: T, readonly rules: U) {}

  isAttributeField(): this is AttributeField<any, any, any> {
    return this.root === 'attributes'
  }

  isRelationshipField(): this is RelationshipField<any, any, any> {
    return this.root === 'relationships'
  }
}

export type AttributeFieldType = 'optional' | 'required'

export type ResourceAttributeFormatter<T extends AttributeValue, U = T> = {
  serialize: (value: U) => T
  deserialize: (value: T) => U
}

const DEFAULT_ATTRIBUTE_FORMATTER = {
  serialize: <T>(value: T) => value,
  deserialize: <T>(value: T) => value,
}

export class AttributeField<
  T,
  U extends AttributeValue,
  V extends ResourceFieldRules
> extends ResourceField<'attributes', V> {
  constructor(
    readonly rules: V,
    readonly validator: AttributeFieldValidator<U>,
    readonly formatter: ResourceAttributeFormatter<U, T>,
  ) {
    super('attributes', rules)
  }
}


export type RelationshipFieldType = 'to-one' | 'to-many'

export class RelationshipField<
  T extends ResourceFormatter<any, any>,
  U extends RelationshipFieldType,
  V extends ResourceFieldRules,
> extends ResourceField<'relationships', V> {
  constructor(readonly rules: V, readonly type: U, readonly getFormatter: () => T) {
    super('relationships', rules)
  }
}

export type ResourceFields = Record<
  ResourceFieldName,
  ResourceField<ResourceFieldRoot, ResourceFieldRules>
>

type ResourceFieldRuleFactory<T extends {
  read: ResourceFieldRule,
  write: ResourceFieldRule,
  update: ResourceFieldRule
}> = [read: T['read'], write: T['write'], update: T['update']]

type ResourceFieldReadRuleFactory<T extends ResourceFieldRule> = ResourceFieldRuleFactory<{
  read: T,
  write: ResourceFieldRule, 
  update: ResourceFieldRule
}>

type ReadableResourceFieldRules = ResourceFieldReadRuleFactory<ResourceFieldRule.Optional | ResourceFieldRule.Required>

export type ResourceFieldNames<
  T extends ResourceFormatter<any, any>,
  U extends ReadableResourceFieldRules = never
> =  never extends U
  ? keyof T['fields']
  : {
      [P in keyof T['fields']]: U extends T['fields'][P]['rules'][number] ? P : never
    }[keyof T['fields']]

export type ReadableResourceFieldNames<T extends ResourceFormatter<any, any>> = ResourceFieldNames<
  T,
  ReadableResourceFieldRules
>

export class ResourceFormatter<T extends ResourceType, U extends ResourceFields> {

  constructor(readonly type: T, readonly fields: U) {}

  createQuery<
    V extends ResourceFieldsFilterLimited<this>, 
    W extends ResourceIncludeFilter<this, V>
  >(fields: V, include: W = null) {
    return {
      fields,
      include
    }
  }

  get fieldNames(): ReadonlyArray<ResourceFieldNames<this>> {
    return Object.keys(this.fields) as any
  }

  get readableFieldNames(): ReadonlyArray<ResourceFieldNames<this, ReadableResourceFieldRules>> {
    return this.fieldNames.filter((fieldName) =>
      this.fields[fieldName].rules[ResourceFieldAction.Read] !== ResourceFieldRule.Forbidden,
    )
  }
}

type BaseResourceFieldsFilter<
  T extends ResourceFormatter<any, any>,
  U extends string = T['type']
> =
  | {
      [P in T['type']]?: ReadonlyArray<keyof T['fields']>
    }
  | {
      [P in keyof T['fields']]: T['fields'][P] extends RelationshipField<
        infer R,
        any,
        any
      >
        ? R['type'] extends U
          ? never
          : BaseResourceFieldsFilter<R, U | R['type']>
        : never
    }[keyof T['fields']]

export type ResourceFieldsFilter<T extends ResourceFormatter<any, any>> = Intersect<
  BaseResourceFieldsFilter<T>
>

export interface ResourceFilterLimited<T extends ResourceFormatter<any, any>> {
  fields?: ResourceFieldsFilterLimited<T>
  include?: ResourceIncludeFilterLimited<T, this['fields']>
}

type Xo = ResourceFilterLimited<typeof event>['include']

export namespace Attribute {
  export type Required<T extends AttributeValue, U = T> = AttributeField<
    U,
    T,
    [ResourceFieldRule.Required, ResourceFieldRule.Optional, ResourceFieldRule.Optional]
  >

  export const required = <T extends AttributeValue, U = T>(
    validator: AttributeFieldValidator<T>,
    formatter: ResourceAttributeFormatter<T, U> = DEFAULT_ATTRIBUTE_FORMATTER as any
  ): Attribute.Required<T, U> => 
    new AttributeField(
      [ResourceFieldRule.Required, ResourceFieldRule.Optional, ResourceFieldRule.Optional],
      validator, 
      formatter
    )
  

  export type Optional<T extends AttributeValue, U = T> = AttributeField<
    U,
    T,
    [ResourceFieldRule.Optional, ResourceFieldRule.Optional, ResourceFieldRule.Optional]
  >

  export const optional = <T extends AttributeValue, U = T>(
    validator: AttributeFieldValidator<T>, 
    formatter: ResourceAttributeFormatter<T, U> = DEFAULT_ATTRIBUTE_FORMATTER as any
  ): Attribute.Optional<T, U> => {
    return new AttributeField(
      [ResourceFieldRule.Optional, ResourceFieldRule.Optional, ResourceFieldRule.Optional],
      validator, 
      formatter,
    )
  }
}

export namespace Relationship {
  export type ToOne<T extends ResourceFormatter<any, any>> = RelationshipField<
    T,
    'to-one',
    [ResourceFieldRule.Optional, ResourceFieldRule.Optional, ResourceFieldRule.Optional]
  >

  export const toOne = <T extends ResourceFormatter<any, any>>(getFormatter: () => T): Relationship.ToOne<T> => {
    return { getFormatter } as any
  }

  export type ToOneRequired<T extends ResourceFormatter<any, any>> = RelationshipField<
    T,
    'to-one',
    [ResourceFieldRule.Required, ResourceFieldRule.Optional, ResourceFieldRule.Optional]
  >

  export const toOneRequired = <T extends ResourceFormatter<any, any>>(getFormatter: () => T): Relationship.ToOneRequired<T> => {
    return { getFormatter } as any
  }

  export type ToMany<T extends ResourceFormatter<any, any>> = RelationshipField<
    T,
    'to-many',
    [ResourceFieldRule.Optional, ResourceFieldRule.Optional, ResourceFieldRule.Optional]
  >

  export const toMany = <T extends ResourceFormatter<any, any>>(getFormatter: () => T): Relationship.ToMany<T> => {
    return { getFormatter } as any
  }
}

const string = {} as AttributeFieldValidator<string>

// Explicit UserFormatter is required for circular relationships
type UserFormatter = ResourceFormatter<
  'User',
  {
    name: Attribute.Optional<string>
    parents: Relationship.ToMany<UserFormatter>
    country: Relationship.ToOne<CountryFormatter>
  }
>

const userFormatter: UserFormatter = new ResourceFormatter('User', {
  name: Attribute.optional(string),
  parents: Relationship.toMany(() => userFormatter),
  country: Relationship.toOne(() => countryFormatter),
})

type CountryFormatter = ResourceFormatter<
  'Country',
  {
    isoName: Attribute.Optional<string>
    test: Attribute.Required<string>
  }
>

const countryFormatter: CountryFormatter = new ResourceFormatter('Country', {
  isoName: Attribute.optional(string),
  test: Attribute.required(string)
})


type ResourceFieldsFilterValue<T extends ResourceFormatter<any, any>> = { 
  [P in T['type']]?: ReadonlyArray<ReadableResourceFieldNames<T>> 
}

type BaseResourceFieldsFilterLimited<R extends ResourceFormatter<any, any>> = ResourceFieldsFilterValue<R> | {
  [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
    ? ResourceFieldsFilterValue<R> | {
        [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
          ? ResourceFieldsFilterValue<R> | {
            [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
              ? ResourceFieldsFilterValue<R> | {
                [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
                  ? ResourceFieldsFilterValue<R> | {
                    [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
                      ? ResourceFieldsFilterValue<R> | {
                        [P in keyof R['fields']]: R['fields'][P] extends RelationshipField<infer R, any, any>
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

type ResourceFieldsFilterLimited<T extends ResourceFormatter<any, any>> = Intersect<BaseResourceFieldsFilterLimited<T>>

type BaseReadableRelationshipFieldNames<T extends ResourceFormatter<any, any>, U extends string = any> = {
  [P in keyof T['fields']]: T['fields'][P] extends RelationshipField<
    any, 
    any, 
    [ResourceFieldRule.Optional | ResourceFieldRule.Required, ResourceFieldRule, ResourceFieldRule]
  > ? P extends U
      ? P 
      : never
    : never
}[keyof T['fields']]


type ResourceIncludeFilterLimited<R extends ResourceFormatter<any, any>, T extends ResourceFieldsFilterLimited<R> = any> = null | {
  [P in BaseReadableRelationshipFieldNames<R, R['type'] extends keyof T ? T[R['type']][number] : any>]?: 
    R['fields'][P] extends RelationshipField<infer R, any, any>
      ? boolean | {
          [P in BaseReadableRelationshipFieldNames<R, R['type'] extends keyof T ? T[R['type']][number] : any>]?: 
            R['fields'][P] extends RelationshipField<infer R, any, any>
              ? boolean | {
                  [P in BaseReadableRelationshipFieldNames<R, R['type'] extends keyof T ? T[R['type']][number] : any>]?: 
                    R['fields'][P] extends RelationshipField<infer R, any, any>
                      ? boolean | {
                          [P in BaseReadableRelationshipFieldNames<R, R['type'] extends keyof T ? T[R['type']][number] : any>]?: 
                            R['fields'][P] extends RelationshipField<infer R, any, any>
                              ? boolean | {
                                  [P in BaseReadableRelationshipFieldNames<R, R['type'] extends keyof T ? T[R['type']][number] : any>]?: 
                                    R['fields'][P] extends RelationshipField<infer R, any, any>
                                      ? boolean | {
                                        [P in BaseReadableRelationshipFieldNames<R, R['type'] extends keyof T ? T[R['type']][number] : any>]?: 
                                          R['fields'][P] extends RelationshipField<any, any, any>
                                            ? boolean
                                            : never
                                      }
                                      : never
                                }
                              : never
                        }
                      : never
                }
              : never
        }
      : never
}

type X = ResourceIncludeFilter<typeof event, {
  Event: ['stages', 'competitors'],
}>

type Y = X['stages'] 

type Z = ResourceIncludeFilter<typeof event, {}>


type BaseReadableRelationshipFieldNamesAlt<T extends ResourceFields, U extends keyof T> = {
  [P in keyof T]: T[P] extends RelationshipField<
    any, 
    any, 
    [ResourceFieldRule.Optional | ResourceFieldRule.Required, ResourceFieldRule, ResourceFieldRule]
  > ? P extends U
      ? P 
      : never
    : 1
}[U]


type BaseResourceFieldsIncludeFilter<T extends ResourceFormatter<any, any>, U extends ResourceFieldsFilterLimited<T>, V> = V extends keyof T['fields'] ? {
  [P in V]?: T['fields'][P] extends RelationshipField<infer R, any, any> ? Intersect<ResourceIncludeFilter<R, U>> : never
} : [V]

type BaseResourceIncludeFilter<
  T extends ResourceFormatter<any, any>, 
  U extends ResourceFieldsFilterLimited<T>, 
  V extends keyof T['fields']
> = {
  [P in keyof T['fields']]?: T['fields'][P] extends RelationshipField<
    infer R, 
    any,
    [ResourceFieldRule.Optional | ResourceFieldRule.Required, any, any]
  > 
    ? (P extends V ? boolean | ResourceIncludeFilter<R, U> : never)
    : never
}

type ResourceIncludeFilter<T extends ResourceFormatter<any, any>, U extends ResourceFieldsFilterLimited<T>> = {
  [P in T['type']]: BaseResourceIncludeFilter<Extract<T, { type: P }>, U, P extends keyof U ? U[P][number] : keyof T['fields']>
}[T['type']]
