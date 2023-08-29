import {
  Attribute,
  Relationship,
  ResourceFieldsFilter,
  FlatIncludedResourceFormatters,
  ResourceFormatter,
} from '../src'
import { string } from '../src/util/validators'

export type FormatterA = ResourceFormatter<
  'a',
  {
    requiredString: Attribute.Required<string>
    optionalString: Attribute.Optional<string>
    toOneB: Relationship.ToOne<FormatterB>
    toManyA: Relationship.ToMany<FormatterA>
  }
>

export const formatterA: FormatterA = new ResourceFormatter('a', {
  requiredString: Attribute.required(string),
  optionalString: Attribute.optional(string),
  toOneB: Relationship.toOne(() => formatterB),
  toManyA: Relationship.toMany(() => formatterA),
})

export type FormatterB = ResourceFormatter<
  'b',
  {
    requiredString: Attribute.Required<string>
    toOneA: Relationship.ToOne<FormatterA>
  }
>

export const formatterB: FormatterB = new ResourceFormatter('b', {
  requiredString: Attribute.required(string),
  toOneA: Relationship.toOne(() => formatterA),
})

type FooBar = FlatIncludedResourceFormatters<FormatterA>

type AFaf = ResourceFieldsFilter<FormatterA>
