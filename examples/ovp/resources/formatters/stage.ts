import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { stageBrackets, StageBrackets } from '../attributes/stageBrackets'
import { stageType, StageType } from '../attributes/stageType'
import { competitor } from './competitor'
import { event } from './event'
import { phase } from './phase'
import { tag } from './tag'

export type StageResource = ResourceFormatter<
  'Stage',
  {
    stageType: Attribute.Required<StageType>
    externalId: Attribute.Optional<string>
    title: Attribute.Required<string>
    startDate: Attribute.Required<string, Date>
    endDate: Attribute.Required<string, Date>
    brackets: Attribute.Optional<StageBrackets>
    event: Relationship.ToOne<typeof event>
    phases: Relationship.ToMany<typeof phase>
    competitors: Relationship.ToMany<typeof competitor>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const stage: StageResource = jsonapi.formatter('Stage', {
  stageType: Attribute.required(stageType),
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  startDate: Attribute.required(isoDateString, isoDateStringFormatter),
  endDate: Attribute.required(isoDateString, isoDateStringFormatter),
  brackets: Attribute.optional(stageBrackets),
  event: Relationship.toOne(() => [event]),
  phases: Relationship.toMany(() => [phase]),
  competitors: Relationship.toMany(() => [competitor]),
  tags: Relationship.toMany(() => [tag]),
})
