import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

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
  phases: Relationship.ToMany<typeof phase>
  competitors: Relationship.ToMany<typeof competitor>
  event: Relationship.ToOne<typeof event>
  tags: Relationship.ToMany<typeof tag>
}

export type StageResource = ResourceFormatter<StageType, StageFields>

export const stage: StageResource = {} as any
