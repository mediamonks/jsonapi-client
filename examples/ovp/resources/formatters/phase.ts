import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { competitor } from './competitor'
import { eventUnit } from './eventUnit'
import { stage } from './stage'
import { tag } from './tag'
import { VODResource } from './vod'

export type PhaseType = 'Phase'

export type PhaseFields = {
  externalId: Attribute.Optional<string>
  title: Attribute.Required<string>
  startDate: Attribute.Optional<string, Date>
  eventUnits: Relationship.ToMany<typeof eventUnit>
  competitors: Relationship.ToMany<typeof competitor>
  tags: Relationship.ToMany<typeof tag>
  stage: Relationship.ToOne<typeof stage>
  highlightVod: Relationship.ToOne<VODResource>
}

export type PhaseResource = ResourceFormatter<PhaseType, PhaseFields>

export const phase: PhaseResource = {} as any
