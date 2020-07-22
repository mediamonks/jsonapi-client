import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { medalRankStatistics, MedalRankStatistics } from '../attributes/medalRankStatistics'
import { asset } from './asset'
import { country } from './country'
import { medalCount } from './medalCount'
import { scheduleSession } from './scheduleSession'
import { tag } from './tag'

export type OrganisationResource = ResourceFormatter<
  'Organisation',
  {
    externalId: Attribute.Required<string>
    name: Attribute.Required<string>
    description: Attribute.Optional<string>
    statistics: Attribute.Required<MedalRankStatistics>
    country: Relationship.ToOne<typeof country>
    flag: Relationship.ToOne<typeof asset>
    medalCounts: Relationship.ToOne<typeof medalCount>
    scheduleSessions: Relationship.ToMany<typeof scheduleSession>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const organisation: OrganisationResource = jsonapi.resource('Organisation', {
  externalId: Attribute.required(string),
  name: Attribute.required(string),
  description: Attribute.optional(string),
  statistics: Attribute.required(medalRankStatistics),
  country: Relationship.toOne(() => [country]),
  flag: Relationship.toOne(() => [asset]),
  medalCounts: Relationship.toOne(() => [medalCount]),
  scheduleSessions: Relationship.toMany(() => [scheduleSession]),
  tags: Relationship.toMany(() => [tag]),
})
