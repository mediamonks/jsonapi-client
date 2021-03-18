import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { aggregateType, AggregateType } from '../attributes/aggregateType'
import { aggregateValue, AggregateValue } from '../attributes/aggregateValue'
import { string } from '../attributes/primitive'
import { discipline, DisciplineResource } from './discipline'
import { tag, TagResource } from './tag'

type AggregateResource = ResourceFormatter<
  'Aggregate',
  {
    key: Attribute.Required<string>
    aggregateType: Attribute.Required<AggregateType>
    value: Attribute.Required<AggregateValue>
    discipline: Relationship.ToOne<DisciplineResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const aggregate: AggregateResource = new ResourceFormatter('Aggregate', {
  key: Attribute.required(string),
  aggregateType: Attribute.required(aggregateType),
  value: Attribute.required(aggregateValue),
  discipline: Relationship.toOne(() => discipline),
  tags: Relationship.toMany(() => tag),
})