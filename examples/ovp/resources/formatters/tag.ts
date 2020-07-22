import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { discipline } from './discipline'
import { event } from './event'
import { individual } from './individual'
import { organisation } from './organisation'

export type TagType = 'Tag'

export type TagFields = {
  tagType: Attribute.Required<string>
  value: Attribute.Required<string>
  discipline: Relationship.ToOne<typeof discipline>
  event: Relationship.ToOne<typeof event>
  individual: Relationship.ToOne<typeof individual>
  organisation: Relationship.ToOne<typeof organisation>
}

export type TagResource = ResourceFormatter<TagType, TagFields>

export const tag: TagResource = jsonapi.resource('Tag', {
  tagType: Attribute.required(string),
  value: Attribute.required(string),
  discipline: Relationship.toOne(() => [discipline]),
  event: Relationship.toOne(() => [event]),
  individual: Relationship.toOne(() => [individual]),
  organisation: Relationship.toOne(() => [organisation]),
})
