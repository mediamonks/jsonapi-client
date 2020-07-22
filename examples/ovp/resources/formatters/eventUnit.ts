import JSONAPI, {
  Attribute,
  Relationship,
  ResourceFormatter,
} from 'jsonapi-client'

import { competitor } from './competitor'
import { MedalResource } from './medal'
import { ParticipantResource } from './participant'
import { PhaseResource } from './phase'
import { ScheduleItemResource } from './scheduleItem'
import { tag } from './tag'
import { VODResource } from './vod'

export type EventUnitType = 'EventUnit'

export type EventUnitFields = {
  externalId: Attribute.Optional<string>
  title: Attribute.Required<string>
  start: Attribute.Optional<string, Date>
  end: Attribute.Optional<string, Date>
  scheduleStatus: Attribute.Optional<string>
  medals: Relationship.ToMany<MedalResource>
  competitors: Relationship.ToMany<typeof competitor>
  participants: Relationship.ToMany<ParticipantResource>
  tags: Relationship.ToMany<typeof tag>
  scheduleItems: Relationship.ToMany<ScheduleItemResource>
  phase: Relationship.ToOne<PhaseResource>
  highlightVod: Relationship.ToOne<VODResource>
}

export type EventUnitResource = ResourceFormatter<
  EventUnitType,
  EventUnitFields
>

export const eventUnit: EventUnitResource = JSONAPI.resource(
  'EventUnit',
  {} as any,
)
