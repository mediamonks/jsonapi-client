import { isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

type WidgetDate = Static<typeof isWidgetData>

const isWidgetData = shape({})

export default class Widget extends JSONAPI.resource('Widget', 'widgets')<Widget> {
  @Attribute.required(isString) public slug!: string
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public widgetType!: string
  @Attribute.required(isWidgetData) public data!: WidgetDate
}
