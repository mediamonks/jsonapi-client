import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { discipline } from './discipline'
import { event } from './event'
import { individual } from './individual'
import { OrganisationResource } from './organisation'

export type TagType = 'Tag'

export type TagFields = {
  tagType: Attribute.Required<string>
  value: Attribute.Required<string>
  discipline: Relationship.ToOne<typeof discipline>
  event: Relationship.ToOne<typeof event>
  individual: Relationship.ToOne<typeof individual>
  organisation: Relationship.ToOne<OrganisationResource>
}

export type TagResource = ResourceFormatter<TagType, TagFields>

export const tag: TagResource = JSONAPI.resource('Tag', {
  tagType: Attribute.required(string),
  value: Attribute.required(string),
  discipline: Relationship.toOne(() => [] as any),
  event: Relationship.toOne(() => [event]),
  individual: Relationship.toOne(() => [individual]),
  organisation: Relationship.toOne(() => [] as any),
})
