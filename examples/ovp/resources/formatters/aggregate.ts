import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { aggregateType, AggregateType } from '../attributes/aggregateType'
import { aggregateValue, AggregateValue } from '../attributes/aggregateValue'
import { string } from '../attributes/primitive'
import { discipline } from './discipline'
import { tag } from './tag'

type AggregateResource = ResourceFormatter<
  'Aggregate',
  {
    key: Attribute.Required<string>
    aggregateType: Attribute.Required<AggregateType>
    value: Attribute.Required<AggregateValue>
    discipline: Relationship.ToOne<typeof discipline>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const aggregate: AggregateResource = jsonapi.formatter('Aggregate', {
  key: Attribute.required(string),
  aggregateType: Attribute.required(aggregateType),
  value: Attribute.required(aggregateValue),
  discipline: Relationship.toOne(() => [discipline]),
  tags: Relationship.toMany(() => [tag]),
})
