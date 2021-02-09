import { Type } from '../../../index'
import { record, isString, isSerializablePrimitive, SerializablePrimitive } from 'isntnt'

export type WidgetData = Record<string, SerializablePrimitive>

export const widgetData: Type<WidgetData> = Type.is(
  'a WidgetData object',
  record(isString, isSerializablePrimitive),
)
