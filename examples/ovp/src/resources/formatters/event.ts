import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'
import { string } from '../attributes/primitive'
import { rsc, RSC } from '../attributes/rsc'
import { competitor, CompetitorResource } from './competitor'
import { discipline, DisciplineResource } from './discipline'
import { medal, MedalResource } from './medal'
import { stage, StageResource } from './stage'
import { tag, TagResource } from './tag'

export type EventResource = ResourceFormatter<
  'Event',
  {
    externalId: Attribute.Optional<string>
    name: Attribute.Required<string>
    rsc: Attribute.Required<RSC>
    discipline: Relationship.ToOne<DisciplineResource>
    competitors: Relationship.ToMany<CompetitorResource>
    stages: Relationship.ToMany<StageResource>
    medals: Relationship.ToMany<MedalResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const event: EventResource = new ResourceFormatter('Event', {
  externalId: Attribute.optional(string),
  name: Attribute.required(string),
  rsc: Attribute.required(rsc),
  discipline: Relationship.toOne(() => discipline),
  competitors: Relationship.toMany(() => competitor),
  stages: Relationship.toMany(() => stage),
  medals: Relationship.toMany(() => medal),
  tags: Relationship.toMany(() => tag),
})
