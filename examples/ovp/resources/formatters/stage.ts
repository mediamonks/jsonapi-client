import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { competitor } from './competitor'
import { event } from './event'
import { phase } from './phase'
import { tag } from './tag'

export type StageType = 'Stage'

export type StageFields = {
  stageType: Attribute.Required<string>
  externalId: Attribute.Optional<string>
  title: Attribute.Required<string>
  startDate: Attribute.Required<string, Date>
  endDate: Attribute.Required<string, Date>
  brackets: Attribute.Optional<{}>
  event: Relationship.ToOne<typeof event>
  phases: Relationship.ToMany<typeof phase>
  competitors: Relationship.ToMany<typeof competitor>
  tags: Relationship.ToMany<typeof tag>
}

export type StageResource = ResourceFormatter<StageType, StageFields>

export const stage: StageResource = jsonapi.resource('Stage', {
  stageType: Attribute.required(string),
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  startDate: Attribute.required(isoDateString, isoDateStringFormatter),
  endDate: Attribute.required(isoDateString, isoDateStringFormatter),
  brackets: Attribute.optional(Type.object),
  event: Relationship.toOne(() => [event]),
  phases: Relationship.toMany(() => [phase]),
  competitors: Relationship.toMany(() => [competitor]),
  tags: Relationship.toMany(() => [tag]),
})
