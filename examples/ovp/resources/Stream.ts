import { array, isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

export type StreamCommentary = Static<typeof isStreamCommentary>

export const isStreamCommentary = shape({
  name: isString,
  language: isString,
})

export default class Stream extends JSONAPI.resource('Stream', 'streams')<Stream> {
  @Attribute.required(isString) public url!: string
  @Attribute.optional(array(isStreamCommentary)) public commentary!: Array<StreamCommentary> | null
}
