import jsonapi, { Attribute, Relationship, ResourceFormatter, ResourceId } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { scheduleSession } from './scheduleSession'
import { tag } from './tag'

export type ChannelResource = ResourceFormatter<
  'Channel',
  {
    name: Attribute.Required<string>
    stream: Attribute.Required<ResourceId>
    scheduleSessions: Relationship.ToMany<typeof scheduleSession>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const channel: ChannelResource = jsonapi.resource('Channel', {
  name: Attribute.required(string),
  stream: Attribute.required(string),
  scheduleSessions: Relationship.toMany(() => [scheduleSession]),
  tags: Relationship.toMany(() => [tag]),
})