import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import {
  competitorExtendedInfo,
  CompetitorExtendedInfo,
} from '../attributes/competitorExtendedInfo'
import { number, string } from '../attributes/primitive'
import { event, EventResource } from './event'
import { eventUnit, EventUnitResource } from './eventUnit'
import { MedalResource, medal } from './medal'
import { ParticipantResource, participant } from './participant'
import { PhaseResource, phase } from './phase'
import { ResultResource, result } from './result'
import { StageResource, stage } from './stage'
import { tag, TagResource } from './tag'

export type CompetitorFormatter = ResourceFormatter<
  'Competitor',
  {
    externalId: Attribute.Required<string>
    order: Attribute.Optional<number>
    extendedInfo: Attribute.Optional<CompetitorExtendedInfo>
    stage: Relationship.ToOne<StageResource>
    event: Relationship.ToOne<EventResource>
    phase: Relationship.ToOne<PhaseResource>
    eventUnit: Relationship.ToOne<EventUnitResource>
    participant: Relationship.ToOne<ParticipantResource>
    medals: Relationship.ToMany<MedalResource>
    results: Relationship.ToMany<ResultResource>
    tags: Relationship.ToMany<TagResource>
  }
>

<<<<<<< HEAD
export const competitor: CompetitorResource = new ResourceFormatter('Competitor', {
=======
export const competitor: CompetitorFormatter = jsonapi.formatter('Competitor', {
>>>>>>> a8d05a3... Upgrade isntnt
  externalId: Attribute.required(string),
  order: Attribute.optional(number),
  extendedInfo: Attribute.optional(competitorExtendedInfo),
  participant: Relationship.toOne(() => participant),
  event: Relationship.toOne(() => event),
  eventUnit: Relationship.toOne(() => eventUnit),
  stage: Relationship.toOne(() => stage),
  phase: Relationship.toOne(() => phase),
  medals: Relationship.toMany(() => medal),
  results: Relationship.toMany(() => result),
  tags: Relationship.toMany(() => tag),
})
