import JSONAPI, { Attribute, Relationship, ResourceFormatter, ResourceId } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { ScheduleSessionResource } from './scheduleSession'
import { tag } from './tag'

export type ChannelType = 'Channel'

export type ChannelFields = {
  name: Attribute.Required<string>
  stream: Attribute.Required<ResourceId> // Stream id?
  scheduleSessions: Relationship.ToMany<ScheduleSessionResource>
  tags: Relationship.ToMany<typeof tag>
}

export type ChannelResource = ResourceFormatter<ChannelType, ChannelFields>

export const channel: ChannelResource = JSONAPI.resource('Channel', {
  name: Attribute.required(string),
  stream: Attribute.required(string),
  scheduleSessions: Relationship.toMany(() => [] as any),
  tags: Relationship.toMany(() => [tag]),
})
