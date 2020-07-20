import JSONAPI, { Attribute, ResourceFormatter } from '../../../../src'

import { string } from './attribute-types/string'
import { url, urlFormatter } from './attribute-types/url'

type PhotoType = 'photos'

type PhotoFields = {
  title: Attribute.Required<string>
  uri: Attribute.Required<string, URL>
}

type PhotoResource = ResourceFormatter<PhotoType, PhotoFields>

const photo: PhotoResource = JSONAPI.resource('photos', {
  title: Attribute.required(string),
  uri: Attribute.required(url, urlFormatter),
})

export default photo
