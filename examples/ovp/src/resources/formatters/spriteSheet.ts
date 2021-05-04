import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string, uint } from '../attributes/primitive'
import { tag, TagResource } from './tag'
import { vod, VODResource } from './vod'

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
    vod: Relationship.ToOne<VODResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const spriteSheet: SpriteSheetResource = new ResourceFormatter('SpriteSheet', {
  rows: Attribute.required(uint),
  columns: Attribute.required(uint),
  width: Attribute.required(uint),
  height: Attribute.required(uint),
  tileWidth: Attribute.required(uint),
  tileHeight: Attribute.required(uint),
  tiles: Attribute.required(uint),
  source: Attribute.required(string),
  vod: Relationship.toOne(() => vod),
  tags: Relationship.toMany(() => tag),
})