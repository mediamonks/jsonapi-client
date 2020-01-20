import { isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

// TODO: find out how we can convert this to Record<string, Primitive>
const isWidgetData = shape({})

export class Widget extends JSONAPI.resource('Widget')<Widget> {
  @Attribute.required(isString) public slug!: string
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public widgetType!: string
  @Attribute.required(isWidgetData) public data!: Static<typeof isWidgetData>
}
