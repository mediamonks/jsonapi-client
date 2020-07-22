import { Attribute, ResourceFormatter } from 'jsonapi-client'

export type RenditionType = 'Rendition'

export type RenditionFields = {
  renditionType: Attribute.Required<string>
  name: Attribute.Required<string>
  source: Attribute.Required<string>
  width: Attribute.Required<number>
  height: Attribute.Required<number>
}

export type RenditionResource = ResourceFormatter<
  RenditionType,
  RenditionFields
>
