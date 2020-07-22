import jsonapi, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { widgetData, WidgetData } from '../attributes/widgetData'

export type WidgetResource = ResourceFormatter<
  'Widget',
  {
    widgetType: Attribute.Required<string>
    title: Attribute.Required<string>
    slug: Attribute.Required<string>
    data: Attribute.Required<WidgetData>
  }
>

export const widget: WidgetResource = jsonapi.resource('Widget', {
  widgetType: Attribute.required(string),
  title: Attribute.required(string),
  slug: Attribute.required(string),
  data: Attribute.required(widgetData),
})
