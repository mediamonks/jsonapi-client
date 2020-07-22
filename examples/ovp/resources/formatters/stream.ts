import { Attribute, ResourceFormatter } from 'jsonapi-client'

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
