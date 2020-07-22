import jsonapi, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string, uint } from '../attributes/primitive'

export type RenditionType = 'Rendition'

export type RenditionFields = {
  renditionType: Attribute.Required<string>
  name: Attribute.Required<string>
  source: Attribute.Required<string>
  width: Attribute.Required<number>
  height: Attribute.Required<number>
}

export type RenditionResource = ResourceFormatter<RenditionType, RenditionFields>

export const rendition: RenditionResource = jsonapi.resource('Rendition', {
  renditionType: Attribute.required(string),
  name: Attribute.required(string),
  source: Attribute.required(string),
  width: Attribute.required(uint),
  height: Attribute.required(uint),
})
