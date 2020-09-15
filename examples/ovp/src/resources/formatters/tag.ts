import jsonapi, { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { tagType, TagType } from '../attributes/tagType'
import { discipline } from './discipline'
import { event } from './event'
import { individual } from './individual'
import { organisation } from './organisation'

export type TagResource = ResourceFormatter<
  'Tag',
  {
    tagType: Attribute.Required<TagType>
    value: Attribute.Required<string>
    discipline: Relationship.ToOne<typeof discipline>
    event: Relationship.ToOne<typeof event>
    individual: Relationship.ToOne<typeof individual>
    organisation: Relationship.ToOne<typeof organisation>
  }
>

export const tag: TagResource = jsonapi.formatter('Tag', {
  tagType: Attribute.required(tagType),
  value: Attribute.required(string),
  discipline: Relationship.toOne(() => discipline),
  event: Relationship.toOne(() => event),
  individual: Relationship.toOne(() => individual),
  organisation: Relationship.toOne(() => organisation),
})
