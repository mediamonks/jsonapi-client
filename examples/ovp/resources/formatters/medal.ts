import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { medalType, MedalType } from '../attributes/medalType'
import { boolean, string, uint } from '../attributes/primitive'
import { competitor } from './competitor'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { organisation } from './organisation'
import { participant } from './participant'

export type MedalResource = ResourceFormatter<
  'Medal',
  {
    externalId: Attribute.Optional<string>
    medalType: Attribute.Required<MedalType>
    description: Attribute.Required<string>
    perpetual: Attribute.Required<boolean>
    determinedDate: Attribute.Optional<string, Date>
    year: Attribute.Optional<number>
    event: Relationship.ToOne<typeof event>
    eventUnit: Relationship.ToOne<typeof eventUnit>
    competitor: Relationship.ToOne<typeof competitor>
    participant: Relationship.ToOne<typeof participant>
    organisation: Relationship.ToOne<typeof organisation>
  }
>

export const medal: MedalResource = jsonapi.formatter('Medal', {
  externalId: Attribute.optional(string),
  medalType: Attribute.required(medalType),
  description: Attribute.required(string),
  perpetual: Attribute.required(boolean),
  determinedDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  year: Attribute.optional(uint),
  event: Relationship.toOne(() => [event]),
  eventUnit: Relationship.toOne(() => [eventUnit]),
  competitor: Relationship.toOne(() => [competitor]),
  participant: Relationship.toOne(() => [participant]),
  organisation: Relationship.toOne(() => [organisation]),
})
