import { Attribute, ResourceFormatter } from '@mediamonks/jsonapi-client'

import { string } from '../attributes/string'
import { url, urlFormatter } from '../attributes/url'

export type PhotoFormatter = ResourceFormatter<
  'photos',
  {
    title: Attribute.Required<string>
    uri: Attribute.Required<string, URL>
  }
>

export const photo: PhotoFormatter = new ResourceFormatter('photos', {
  title: Attribute.required(string),
  uri: Attribute.required(url, urlFormatter),
})
