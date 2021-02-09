import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { medalRankStatistics, MedalRankStatistics } from '../attributes/medalRankStatistics'
import { asset, AssetResource } from './asset'
import { country, CountryResource } from './country'
import { medalCount, MedalCountResource } from './medalCount'
import { scheduleSession, ScheduleSessionResource } from './scheduleSession'
import { tag, TagResource } from './tag'

export type OrganisationResource = ResourceFormatter<
  'Organisation',
  {
    externalId: Attribute.Required<string>
    name: Attribute.Required<string>
    description: Attribute.Optional<string>
    statistics: Attribute.Required<MedalRankStatistics>
    country: Relationship.ToOne<CountryResource>
    flag: Relationship.ToOne<AssetResource>
    medalCounts: Relationship.ToOne<MedalCountResource>
    scheduleSessions: Relationship.ToMany<ScheduleSessionResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const organisation: OrganisationResource = new ResourceFormatter('Organisation', {
  externalId: Attribute.required(string),
  name: Attribute.required(string),
  description: Attribute.optional(string),
  statistics: Attribute.required(medalRankStatistics),
  country: Relationship.toOne(() => country),
  flag: Relationship.toOne(() => asset),
  medalCounts: Relationship.toOne(() => medalCount),
  scheduleSessions: Relationship.toMany(() => scheduleSession),
  tags: Relationship.toMany(() => tag),
})
