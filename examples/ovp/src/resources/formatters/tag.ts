import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { tagType, TagType } from '../attributes/tagType'
import { discipline, DisciplineResource } from './discipline'
import { event, EventResource } from './event'
import { individual, IndividualResource } from './individual'
import { organisation, OrganisationResource } from './organisation'

export type TagResource = ResourceFormatter<
  'Tag',
  {
    tagType: Attribute.Required<TagType>
    value: Attribute.Required<string>
    discipline: Relationship.ToOne<DisciplineResource>
    event: Relationship.ToOne<EventResource>
    individual: Relationship.ToOne<IndividualResource>
    organisation: Relationship.ToOne<OrganisationResource>
  }
>

export const tag: TagResource = new ResourceFormatter('Tag', {
  tagType: Attribute.required(tagType),
  value: Attribute.required(string),
  discipline: Relationship.toOne(() => discipline),
  event: Relationship.toOne(() => event),
  individual: Relationship.toOne(() => individual),
  organisation: Relationship.toOne(() => organisation),
})
