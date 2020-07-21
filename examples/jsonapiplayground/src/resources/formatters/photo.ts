import JSONAPI, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/string'
import { url, urlFormatter } from '../attributes/url'

type PhotoType = 'photos'

type PhotoFields = {
  title: Attribute.Required<string>
  uri: Attribute.Required<string, URL>
}

type PhotoResource = ResourceFormatter<PhotoType, PhotoFields>

export const photo: PhotoResource = JSONAPI.resource('photos', {
  title: Attribute.required(string),
  uri: Attribute.required(url, urlFormatter),
})
