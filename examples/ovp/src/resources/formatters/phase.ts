import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { competitor, CompetitorResource } from './competitor'
import { eventUnit, EventUnitResource } from './eventUnit'
import { stage, StageResource } from './stage'
import { tag, TagResource } from './tag'
import { vod, VODResource } from './vod'

export type PhaseResource = ResourceFormatter<
  'Phase',
  {
    externalId: Attribute.Optional<string>
    title: Attribute.Required<string>
    startDate: Attribute.Optional<string, Date>
    stage: Relationship.ToOne<StageResource>
    highlightVod: Relationship.ToOne<VODResource>
    eventUnits: Relationship.ToMany<EventUnitResource>
    competitors: Relationship.ToMany<CompetitorResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const phase: PhaseResource = new ResourceFormatter('Phase', {
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  startDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  stage: Relationship.toOne(() => stage),
  highlightVod: Relationship.toOne(() => vod),
  eventUnits: Relationship.toMany(() => eventUnit),
  competitors: Relationship.toMany(() => competitor),
  tags: Relationship.toMany(() => tag),
})
