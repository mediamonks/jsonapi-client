import jsonapi, { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { rsc, RSC } from '../attributes/rsc'
import { competitor } from './competitor'
import { discipline } from './discipline'
import { medal } from './medal'
import { stage } from './stage'
import { tag } from './tag'

export type EventResource = ResourceFormatter<
  'Event',
  {
    externalId: Attribute.Optional<string>
    name: Attribute.Required<string>
    rsc: Attribute.Required<RSC>
    discipline: Relationship.ToOne<typeof discipline>
    competitors: Relationship.ToMany<typeof competitor>
    stages: Relationship.ToMany<typeof stage>
    medals: Relationship.ToMany<typeof medal>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const event: EventResource = jsonapi.formatter('Event', {
  externalId: Attribute.optional(string),
  name: Attribute.required(string),
  rsc: Attribute.required(rsc),
  discipline: Relationship.toOne(() => discipline),
  competitors: Relationship.toMany(() => competitor),
  stages: Relationship.toMany(() => stage),
  medals: Relationship.toMany(() => medal),
  tags: Relationship.toMany(() => tag),
})
