import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { string } from '../attributes/primitive'
import { rendition } from './rendition'
import { tag } from './tag'

export type AssetResource = ResourceFormatter<
  'Asset',
  {
    assetType: Attribute.Optional<string>
    name: Attribute.Required<string>
    source: Attribute.Required<string>
    alt: Attribute.Optional<string>
    rendition: Relationship.ToMany<typeof rendition>
    tags: Relationship.ToMany<typeof tag>
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
