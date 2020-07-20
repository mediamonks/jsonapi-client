import { isString } from 'isntnt'
import JSONAPI, { Attribute, ResourceFormatter } from '../../../../src'

import { isImageUrl, urlFormatter } from './attribute-types/url'

type PhotoType = 'photos'

type PhotoFields = {
  title: Attribute.Required<string>
  uri: Attribute.Required<string, URL>
}

type PhotoResource = ResourceFormatter<PhotoType, PhotoFields>

const photo: PhotoResource = JSONAPI.resource('photos', {
  title: Attribute.required(isString),
  uri: Attribute.required(isImageUrl, urlFormatter),
})

export default photo
