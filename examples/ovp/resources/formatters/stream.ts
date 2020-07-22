import jsonapi, { Attribute, ResourceFormatter } from 'jsonapi-client'
import { string } from '../attributes/primitive'
import { isoDateString, isoDateStringFormatter } from '../attributes/date'

export type StreamType = 'Stream'

export type StreamFields = {
  streamType: Attribute.Required<string>
  stream: Attribute.Optional<string>
  start: Attribute.Optional<string, Date>
  end: Attribute.Optional<string, Date>
  manifestUrl: Attribute.Optional<string>
  origin: Attribute.Optional<string>
  alias: Attribute.Optional<string>
  path: Attribute.Optional<string>
}

export type StreamResource = ResourceFormatter<StreamType, StreamFields>

export const stream: StreamResource = jsonapi.resource('Stream', {
  streamType: Attribute.required(string),
  stream: Attribute.optional(string),
  start: Attribute.optional(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  manifestUrl: Attribute.optional(string),
  origin: Attribute.optional(string),
  alias: Attribute.optional(string),
  path: Attribute.optional(string),
})
