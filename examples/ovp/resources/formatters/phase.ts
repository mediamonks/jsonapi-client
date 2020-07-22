import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { competitor } from './competitor'
import { eventUnit } from './eventUnit'
import { stage } from './stage'
import { tag } from './tag'
import { vod } from './vod'

export type PhaseResource = ResourceFormatter<
  'Phase',
  {
    externalId: Attribute.Optional<string>
    title: Attribute.Required<string>
    startDate: Attribute.Optional<string, Date>
    stage: Relationship.ToOne<typeof stage>
    highlightVod: Relationship.ToOne<typeof vod>
    eventUnits: Relationship.ToMany<typeof eventUnit>
    competitors: Relationship.ToMany<typeof competitor>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const phase: PhaseResource = jsonapi.resource('Phase', {
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  startDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  stage: Relationship.toOne(() => [stage]),
  highlightVod: Relationship.toOne(() => [vod]),
  eventUnits: Relationship.toMany(() => [eventUnit]),
  competitors: Relationship.toMany(() => [competitor]),
  tags: Relationship.toMany(() => [tag]),
})
