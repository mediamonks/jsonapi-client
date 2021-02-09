import { Attribute, Relationship, ResourceFormatter, ResourceId } from '../../../../../src'

import { string } from '../attributes/primitive'
import { scheduleSession, ScheduleSessionResource } from './scheduleSession'
import { tag, TagResource } from './tag'

export type ChannelResource = ResourceFormatter<
  'Channel',
  {
    name: Attribute.Required<string>
    stream: Attribute.Required<ResourceId>
    scheduleSessions: Relationship.ToMany<ScheduleSessionResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const channel: ChannelResource = new ResourceFormatter('Channel', {
  name: Attribute.required(string),
  stream: Attribute.required(string),
  scheduleSessions: Relationship.toMany(() => scheduleSession),
  tags: Relationship.toMany(() => tag),
})
