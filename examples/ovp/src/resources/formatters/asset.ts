import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { rendition, RenditionResource } from './rendition'
import { tag, TagResource } from './tag'

export type AssetResource = ResourceFormatter<
  'Asset',
  {
    assetType: Attribute.Optional<string>
    name: Attribute.Required<string>
    source: Attribute.Required<string>
    alt: Attribute.Optional<string>
    rendition: Relationship.ToMany<RenditionResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const asset: AssetResource = new ResourceFormatter('Asset', {
  assetType: Attribute.optional(string),
  name: Attribute.required(string),
  source: Attribute.required(string),
  alt: Attribute.optional(string),
  rendition: Relationship.toMany(() => rendition),
  tags: Relationship.toMany(() => tag),
})
