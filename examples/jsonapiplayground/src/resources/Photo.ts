import { isString } from 'isntnt'
import { resource, Attribute, ResourceConstructor } from '../../../../src'

import { isImageUrl, urlFormatter } from './attribute-types'

type PhotoType = 'photos'

type PhotoFields = {
  title: Attribute.Required<string>
  uri: Attribute.Required<string, URL>
}

type PhotoResource = ResourceConstructor<PhotoType, PhotoFields>

const Photo: PhotoResource = resource('photos', 'photos', {
  title: Attribute.required(isString),
  uri: Attribute.required(isImageUrl, urlFormatter),
})

export default Photo
