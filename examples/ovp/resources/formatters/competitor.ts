import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'
import { Type } from 'jsonapi-client'

import { number, string } from '../attributes/primitive'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { MedalResource, medal } from './medal'
import { ParticipantResource, participant } from './participant'
import { PhaseResource, phase } from './phase'
import { ResultResource, result } from './result'
import { StageResource, stage } from './stage'
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

export const competitor: CompetitorResource = jsonapi.resource('Competitor', {
  externalId: Attribute.required(string),
  order: Attribute.optional(number), // Should be sortOrder?
  extendedInfo: Attribute.optional(Type.object),
  participant: Relationship.toOne(() => [participant]),
  event: Relationship.toOne(() => [event]),
  eventUnit: Relationship.toOne(() => [eventUnit]),
  stage: Relationship.toOne(() => [stage]),
  phase: Relationship.toOne(() => [phase]),
  medals: Relationship.toMany(() => [medal]),
  results: Relationship.toMany(() => [result]),
  tags: Relationship.toMany(() => [tag]),
})
