import JSONAPI, {
  Attribute,
  Relationship,
  ResourceFormatter,
} from 'jsonapi-client'

import { competitor } from './competitor'
import { discipline } from './discipline'
import { MedalResource } from './medal'
import { StageResource } from './stage'
import { tag } from './tag'

export type EventType = 'Event'

export type EventFields = {
  externalId: Attribute.Optional<string> // Optional?
  name: Attribute.Required<string>
  rsc: Attribute.Required<{}>
  discipline: Relationship.ToOne<typeof discipline>
  stages: Relationship.ToMany<StageResource>
  medals: Relationship.ToMany<MedalResource>
  competitors: Relationship.ToMany<typeof competitor>
  tags: Relationship.ToMany<typeof tag>
}

export type EventResource = ResourceFormatter<EventType, EventFields>

export const event: EventResource = JSONAPI.resource('Event', {} as any)
