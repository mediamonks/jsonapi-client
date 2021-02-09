import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { string } from '../attributes/primitive'
import { media } from './media'

type AlbumResource = ResourceFormatter<
  'Album',
  {
    title: Attribute.Required<string>
    media: Relationship.ToMany<typeof media>
  }
>

export const album: AlbumResource = new ResourceFormatter('Album', {
  title: Attribute.required(string),
  media: Relationship.toMany(() => media),
})
