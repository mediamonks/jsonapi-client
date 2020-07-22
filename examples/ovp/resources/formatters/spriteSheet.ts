import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string, uint } from '../attributes/primitive'
import { tag } from './tag'
import { vod } from './vod'

export type SpriteSheetResource = ResourceFormatter<
  'SpriteSheet',
  {
    rows: Attribute.Required<number>
    columns: Attribute.Required<number>
    width: Attribute.Required<number>
    height: Attribute.Required<number>
    tileWidth: Attribute.Required<number>
    tileHeight: Attribute.Required<number>
    tiles: Attribute.Required<number>
    source: Attribute.Required<string>
    vod: Relationship.ToOne<typeof vod>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const spriteSheet: SpriteSheetResource = jsonapi.resource('SpriteSheet', {
  rows: Attribute.required(uint),
  columns: Attribute.required(uint),
  width: Attribute.required(uint),
  height: Attribute.required(uint),
  tileWidth: Attribute.required(uint),
  tileHeight: Attribute.required(uint),
  tiles: Attribute.required(uint),
  source: Attribute.required(string),
  vod: Relationship.toOne(() => [vod]),
  tags: Relationship.toMany(() => [tag]),
})
