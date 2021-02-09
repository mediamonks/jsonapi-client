import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { medalStatistics, MedalStatistics } from '../attributes/medalStatistics'
import { boolean, string, uint } from '../attributes/primitive'
import { asset, AssetResource } from './asset'
import { event, EventResource } from './event'
import { participant, ParticipantResource } from './participant'
import { tag, TagResource } from './tag'

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
    pictogram: Relationship.ToOne<AssetResource>
    thumbnail: Relationship.ToOne<AssetResource>
    participants: Relationship.ToMany<ParticipantResource>
    events: Relationship.ToMany<EventResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const discipline: DisciplineResource = new ResourceFormatter('Discipline', {
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
