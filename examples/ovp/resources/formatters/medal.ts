import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { boolean, string, uint } from '../attributes/primitive'
import { competitor } from './competitor'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { organisation } from './organisation'
import { participant } from './participant'

export type MedalType = 'Medal'

export type MedalFields = {
  externalId: Attribute.Optional<string>
  medalType: Attribute.Required<string>
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

export type MedalResource = ResourceFormatter<MedalType, MedalFields>

export const medal: MedalResource = jsonapi.resource('Medal', {
  externalId: Attribute.optional(string),
  medalType: Attribute.required(string),
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
