import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import {
  competitorExtendedInfo,
  CompetitorExtendedInfo,
} from '../attributes/competitorExtendedInfo'
import { number, string } from '../attributes/primitive'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { MedalResource, medal } from './medal'
import { ParticipantResource, participant } from './participant'
import { PhaseResource, phase } from './phase'
import { ResultResource, result } from './result'
import { StageResource, stage } from './stage'
import { tag } from './tag'

export type CompetitorResource = ResourceFormatter<
  'Competitor',
  {
    externalId: Attribute.Required<string>
    order: Attribute.Optional<number>
    extendedInfo: Attribute.Optional<CompetitorExtendedInfo>
    stage: Relationship.ToOne<StageResource>
    event: Relationship.ToOne<typeof event>
    phase: Relationship.ToOne<PhaseResource>
    eventUnit: Relationship.ToOne<typeof eventUnit>
    participant: Relationship.ToOne<ParticipantResource>
    medals: Relationship.ToMany<MedalResource>
    results: Relationship.ToMany<ResultResource>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const competitor: CompetitorResource = jsonapi.resource('Competitor', {
  externalId: Attribute.required(string),
  order: Attribute.optional(number),
  extendedInfo: Attribute.optional(competitorExtendedInfo),
  participant: Relationship.toOne(() => [participant]),
  event: Relationship.toOne(() => [event]),
  eventUnit: Relationship.toOne(() => [eventUnit]),
  stage: Relationship.toOne(() => [stage]),
  phase: Relationship.toOne(() => [phase]),
  medals: Relationship.toMany(() => [medal]),
  results: Relationship.toMany(() => [result]),
  tags: Relationship.toMany(() => [tag]),
})
