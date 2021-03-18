import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { pageSlug, PageSlug } from '../attributes/pageSlug'
import { string, uint } from '../attributes/primitive'
import { widget, WidgetResource } from './widget'

export type PageResource = ResourceFormatter<
  'Page',
  {
    title: Attribute.Required<string>
    slug: Attribute.Required<PageSlug>
    path: Attribute.Required<string>
    navigationIndex: Attribute.Optional<number>
    widgets: Relationship.ToMany<WidgetResource>
  }
>

export const page: PageResource = new ResourceFormatter('Page', {
  title: Attribute.required(string),
  slug: Attribute.required(pageSlug),
  path: Attribute.required(string),
  navigationIndex: Attribute.optional(uint),
  widgets: Relationship.toMany(() => widget),
})