import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { WidgetResource } from './Widget'

export type PageType = 'Page'

export type PageFields = {
  title: Attribute.Required<string>
  slug: Attribute.Required<string>
  path: Attribute.Required<string>
  navigationIndex: Attribute.Optional<number>
  widgets: Relationship.ToMany<WidgetResource>
}

export type PageResource = ResourceFormatter<PageType, PageFields>
