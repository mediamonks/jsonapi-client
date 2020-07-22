import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { tag } from './tag'
import { VODResource } from './vod'

export type SpriteSheetType = 'SpriteSheet'

export type SpriteSheetFields = {
  rows: Attribute.Required<number>
  columns: Attribute.Required<number>
  width: Attribute.Required<number>
  height: Attribute.Required<number>
  tileWidth: Attribute.Required<number>
  tileHeight: Attribute.Required<number>
  tiles: Attribute.Required<number>
  source: Attribute.Required<string>
  vod: Relationship.ToOne<VODResource>
  tags: Relationship.ToOne<typeof tag>
}

export type SpriteSheetResource = ResourceFormatter<
  SpriteSheetType,
  SpriteSheetFields
>
