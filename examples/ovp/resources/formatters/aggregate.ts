import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { discipline } from './discipline'
import { tag } from './tag'

type AggregateType = 'Aggregate'

type AggregateFields = {
  key: Attribute.Required<string>
  aggregateType: Attribute.Required<string>
  value: Attribute.Required<{}>
  discipline: Relationship.ToOne<typeof discipline>
  tags: Relationship.ToMany<typeof tag>
}

type AggregateResource = ResourceFormatter<AggregateType, AggregateFields>

export const aggregate: AggregateResource = jsonapi.resource('Aggregate', {
  key: Attribute.required(string),
  aggregateType: Attribute.required(string),
  value: Attribute.required(Type.object),
  discipline: Relationship.toOne(() => [discipline]),
  tags: Relationship.toMany(() => [tag]),
})
