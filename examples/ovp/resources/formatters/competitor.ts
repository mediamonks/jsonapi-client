import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'
import { Type } from 'jsonapi-client'

import { number, string } from '../attributes/primitive'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { MedalResource } from './medal'
import { ParticipantResource } from './participant'
import { PhaseResource } from './phase'
import { ResultResource } from './result'
import { StageResource } from './stage'
import { tag } from './tag'

export type CompetitorType = 'Competitor'

export type CompetitorFields = {
  externalId: Attribute.Required<string>
  order: Attribute.Optional<number>
  extendedInfo: Attribute.Optional<{}>
  stage: Relationship.ToOne<StageResource>
  event: Relationship.ToOne<typeof event>
  phase: Relationship.ToOne<PhaseResource>
  eventUnit: Relationship.ToOne<typeof eventUnit>
  participant: Relationship.ToOne<ParticipantResource>
  medals: Relationship.ToMany<MedalResource>
  results: Relationship.ToMany<ResultResource>
  tags: Relationship.ToMany<typeof tag>
}

export type CompetitorResource = ResourceFormatter<CompetitorType, CompetitorFields>

export const competitor: CompetitorResource = JSONAPI.resource('Competitor', {
  externalId: Attribute.required(string),
  order: Attribute.optional(number), // Should be sortOrder?
  extendedInfo: Attribute.optional(Type.object),
  stage: Relationship.toOne(() => [] as any),
  event: Relationship.toOne(() => [event]),
  phase: Relationship.toOne(() => [] as any),
  eventUnit: Relationship.toOne(() => [eventUnit]),
  participant: Relationship.toOne(() => [] as any),
  medals: Relationship.toMany(() => [] as any),
  results: Relationship.toMany(() => [] as any),
  tags: Relationship.toMany(() => [tag]),
})
