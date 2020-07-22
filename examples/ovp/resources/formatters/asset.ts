import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { RenditionResource } from './rendition'
import { tag } from './tag'

export type AssetType = 'Asset'

export type AssetFields = {
  assetType: Attribute.Required<string>
  name: Attribute.Required<string>
  source: Attribute.Required<string>
  alt: Attribute.Optional<string>
  rendition: Relationship.ToMany<RenditionResource>
  tags: Relationship.ToMany<typeof tag>
}

export type AssetResource = ResourceFormatter<AssetType, AssetFields>

export const asset: AssetResource = JSONAPI.resource('Asset', {
  assetType: Attribute.required(string),
  name: Attribute.required(string),
  source: Attribute.required(string),
  alt: Attribute.optional(string),
  rendition: Relationship.toMany(() => [] as any),
  tags: Relationship.toMany(() => [tag]),
})
