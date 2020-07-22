import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { rendition } from './rendition'
import { tag } from './tag'

export type AssetResource = ResourceFormatter<
  'Asset',
  {
    assetType: Attribute.Required<string>
    name: Attribute.Required<string>
    source: Attribute.Required<string>
    alt: Attribute.Optional<string>
    rendition: Relationship.ToMany<typeof rendition>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const asset: AssetResource = jsonapi.resource('Asset', {
  assetType: Attribute.required(string),
  name: Attribute.required(string),
  source: Attribute.required(string),
  alt: Attribute.optional(string),
  rendition: Relationship.toMany(() => [rendition]),
  tags: Relationship.toMany(() => [tag]),
})
