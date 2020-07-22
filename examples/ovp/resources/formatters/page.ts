import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string, uint } from '../attributes/primitive'
import { widget } from './widget'

export type PageType = 'Page'

export type PageFields = {
  title: Attribute.Required<string>
  slug: Attribute.Required<string>
  path: Attribute.Required<string>
  navigationIndex: Attribute.Optional<number>
  widgets: Relationship.ToMany<typeof widget>
}

export type PageResource = ResourceFormatter<PageType, PageFields>

export const page: PageResource = jsonapi.resource('Page', {
  title: Attribute.required(string),
  slug: Attribute.required(string),
  path: Attribute.required(string),
  navigationIndex: Attribute.optional(uint),
  widgets: Relationship.toMany(() => [widget]),
})
