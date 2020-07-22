import { Attribute, ResourceFormatter } from 'jsonapi-client'

export type PlaybackSessionType = 'PlaybackSession'

export type PlaybackSessionFields = {
  url: Attribute.Required<string>
}

export type PlaybackSessionResource = ResourceFormatter<
  PlaybackSessionType,
  PlaybackSessionFields
>
