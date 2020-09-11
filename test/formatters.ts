import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../src'
import { string } from '../src/util/validators'

type FormatterAFields = {
  requiredAttribute: Attribute.Required<string>
  optionalAttribute: Attribute.Optional<string>
  toOneRelationship: Relationship.ToOne<typeof formatterA>
  toManyRelationship: Relationship.ToMany<typeof formatterB>
}

export const formatterA: ResourceFormatter<'a', FormatterAFields> = JSONAPI.formatter('a', {
  requiredAttribute: Attribute.required(string),
  optionalAttribute: Attribute.optional(string),
  toOneRelationship: Relationship.toOne(() => [formatterA]),
  toManyRelationship: Relationship.toMany(() => [formatterB]),
})

type FormatterBFields = {
  foo: Attribute.Required<string>
}

export const formatterB: ResourceFormatter<'b', FormatterBFields> = JSONAPI.formatter('b', {
  foo: Attribute.required(string),
  toOneA: Relationship.toOne(() => [formatterA]),
})
