import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { asset } from './asset'
import { StageResource } from './stage'
import { MedalResource } from './medal'

export type MediaType = 'Media'

export type MediaFields = {
  typeMedia: Attribute.Required<string>
  title: Attribute.Required<string>
  assets: Relationship.ToMany<typeof asset>
  stage: Relationship.ToOne<StageResource>
}

export type MediaResource = ResourceFormatter<MediaType, MediaFields>

export const medal: MedalResource = {} as any
