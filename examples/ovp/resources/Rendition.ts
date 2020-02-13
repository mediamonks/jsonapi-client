import { isString } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

export default class Rendition extends JSONAPI.resource('Rendition', 'renditions')<Rendition> {
  @Attribute.required(isString) public renditionType!: string
  @Attribute.required(isString) public name!: string
  @Attribute.required(isString) public source!: string
  @Attribute.required(isString) public width!: number
  @Attribute.required(isString) public height!: number
}
