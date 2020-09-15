import jsonapi, { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { medalStatistics, MedalStatistics } from '../attributes/medalStatistics'
import { boolean, string, uint } from '../attributes/primitive'
import { asset } from './asset'
import { event } from './event'
import { participant } from './participant'
import { tag } from './tag'

export type DisciplineResource = ResourceFormatter<
  'Discipline',
  {
    externalId: Attribute.Required<string>
    name: Attribute.Required<string>
    description: Attribute.Optional<string>
    eventCount: Attribute.Required<number>
    isFeatured: Attribute.Required<boolean>
    isNew: Attribute.Required<boolean>
    federationLink: Attribute.Optional<string>
    federationLabel: Attribute.Optional<string>
    statistics: Attribute.Required<MedalStatistics>
    pictogram: Relationship.ToOne<typeof asset>
    thumbnail: Relationship.ToOne<typeof asset>
    participants: Relationship.ToMany<typeof participant>
    events: Relationship.ToMany<typeof event>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const discipline: DisciplineResource = jsonapi.formatter('Discipline', {
  externalId: Attribute.required(string),
  name: Attribute.required(string),
  description: Attribute.optional(string),
  eventCount: Attribute.required(uint),
  isFeatured: Attribute.required(boolean),
  isNew: Attribute.required(boolean),
  federationLink: Attribute.optional(string),
  federationLabel: Attribute.optional(string),
  statistics: Attribute.required(medalStatistics),
  pictogram: Relationship.toOne(() => asset),
  participants: Relationship.toMany(() => participant),
  thumbnail: Relationship.toOne(() => asset),
  events: Relationship.toMany(() => event),
  tags: Relationship.toMany(() => tag),
})
