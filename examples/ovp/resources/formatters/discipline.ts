import JSONAPI, {
  Attribute,
  Relationship,
  ResourceFormatter,
} from 'jsonapi-client'

import { asset } from './asset'
import { event } from './event'
import { ParticipantResource } from './participant'
import { tag } from './tag'

export type DisciplineType = 'Discipline'

export type DisciplineFields = {
  externalId: Attribute.Required<string>
  name: Attribute.Required<string>
  description: Attribute.Optional<string>
  eventCount: Attribute.Required<number>
  isFeatured: Attribute.Required<boolean>
  isNew: Attribute.Required<boolean>
  federationLink: Attribute.Optional<string>
  federationLabel: Attribute.Optional<string>
  statistics: Attribute.Required<{}>
  participants: Relationship.ToMany<ParticipantResource>
  events: Relationship.ToMany<typeof event>
  pictogram: Relationship.ToOne<typeof asset>
  thumbnail: Relationship.ToOne<typeof asset>
  tags: Relationship.ToMany<typeof tag>
}

export type DisciplineResource = ResourceFormatter<
  DisciplineType,
  DisciplineFields
>

export const discipline: DisciplineResource = JSONAPI.resource(
  'Discipline',
  {} as any,
)
