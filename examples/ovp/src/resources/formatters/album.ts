import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { media, MediaResource } from './media'

type AlbumResource = ResourceFormatter<
  'Album',
  {
    title: Attribute.Required<string>
    media: Relationship.ToMany<MediaResource>
  }
>

export const album: AlbumResource = new ResourceFormatter('Album', {
  title: Attribute.required(string),
  media: Relationship.toMany(() => media),
})
