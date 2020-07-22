import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { competitor } from './competitor'
import { discipline } from './discipline'
import { medal } from './medal'
import { stage } from './stage'
import { tag } from './tag'

export type EventType = 'Event'

export type EventFields = {
  externalId: Attribute.Optional<string>
  name: Attribute.Required<string>
  rsc: Attribute.Required<{}>
  discipline: Relationship.ToOne<typeof discipline>
  competitors: Relationship.ToMany<typeof competitor>
  stages: Relationship.ToMany<typeof stage>
  medals: Relationship.ToMany<typeof medal>
  tags: Relationship.ToMany<typeof tag>
}

export type EventResource = ResourceFormatter<EventType, EventFields>

export const event: EventResource = jsonapi.resource('Event', {
  externalId: Attribute.optional(string),
  name: Attribute.required(string),
  rsc: Attribute.required(Type.object),
  discipline: Relationship.toOne(() => [discipline]),
  competitors: Relationship.toMany(() => [competitor]),
  stages: Relationship.toMany(() => [stage]),
  medals: Relationship.toMany(() => [medal]),
  tags: Relationship.toMany(() => [tag]),
})
