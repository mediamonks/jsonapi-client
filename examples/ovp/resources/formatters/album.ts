import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { MediaResource } from './media'

type AlbumType = 'Album'

type AlbumFields = {
  title: Attribute.Required<string>
  media: Relationship.ToMany<MediaResource>
}

type AlbumResource = ResourceFormatter<AlbumType, AlbumFields>

export const album: AlbumResource = JSONAPI.resource('Album', {
  title: Attribute.required(string),
  media: Relationship.toMany(() => [] as any),
})
