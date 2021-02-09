import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { stageBrackets, StageBrackets } from '../attributes/stageBrackets'
import { stageType, StageType } from '../attributes/stageType'
import { competitor, CompetitorResource } from './competitor'
import { event, EventResource } from './event'
import { phase, PhaseResource } from './phase'
import { tag, TagResource } from './tag'

export type StageResource = ResourceFormatter<
  'Stage',
  {
    stageType: Attribute.Required<StageType>
    externalId: Attribute.Optional<string>
    title: Attribute.Required<string>
    startDate: Attribute.Optional<string, Date>
    endDate: Attribute.Optional<string, Date>
    brackets: Attribute.Optional<StageBrackets>
    event: Relationship.ToOne<EventResource>
    phases: Relationship.ToMany<PhaseResource>
    competitors: Relationship.ToMany<CompetitorResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const stage: StageResource = new ResourceFormatter('Stage', {
  stageType: Attribute.required(stageType),
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  startDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  endDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  brackets: Attribute.optional(stageBrackets),
  event: Relationship.toOne(() => event),
  phases: Relationship.toMany(() => phase),
  competitors: Relationship.toMany(() => competitor),
  tags: Relationship.toMany(() => tag),
})
