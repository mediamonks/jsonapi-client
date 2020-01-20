import { array, isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

const isCommentary = array(
  shape({
    name: isString,
    language: isString,
  }),
)

export class Stream extends JSONAPI.resource('Stream')<Stream> {
  @Attribute.required(isString) public url!: string
  @Attribute.optional(isCommentary) public commentary!: Static<typeof isCommentary> | null
}
