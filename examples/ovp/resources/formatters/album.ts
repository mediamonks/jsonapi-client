import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { media } from './media'

type AlbumResource = ResourceFormatter<
  'Album',
  {
    title: Attribute.Required<string>
    media: Relationship.ToMany<typeof media>
  }
>

export const album: AlbumResource = jsonapi.resource('Album', {
  title: Attribute.required(string),
  media: Relationship.toMany(() => [media]),
})
