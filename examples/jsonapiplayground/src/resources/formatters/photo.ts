import { Attribute, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/string'
import { url, urlFormatter } from '../attributes/url'

type PhotoResource = ResourceFormatter<
  'photos',
  {
    title: Attribute.Required<string>
    uri: Attribute.Required<string, URL>
  }
>

export const photo: PhotoResource = new ResourceFormatter('photos', {
  title: Attribute.required(string),
  uri: Attribute.required(url, urlFormatter),
})