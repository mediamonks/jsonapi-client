import jsonapi, { Attribute, ResourceFormatter, Type } from 'jsonapi-client'

import { string } from '../attributes/primitive'

export type WidgetType = 'Widget'

export type WidgetFields = {
  widgetType: Attribute.Required<string>
  title: Attribute.Required<string>
  slug: Attribute.Required<string>
  data: Attribute.Required<{}>
}

export type WidgetResource = ResourceFormatter<WidgetType, WidgetFields>

export const widget: WidgetResource = jsonapi.resource('Widget', {
  widgetType: Attribute.required(string),
  title: Attribute.required(string),
  slug: Attribute.required(string),
  data: Attribute.required(Type.object),
})
