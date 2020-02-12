import { array, isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

const isCommentary = array(
  shape({
    name: isString,
    language: isString,
  }),
)

export default class Stream extends JSONAPI.resource('Stream', 'streams')<Stream> {
  @Attribute.required(isString) public url!: string
  @Attribute.optional(isCommentary) public commentary!: Static<typeof isCommentary> | null
}
