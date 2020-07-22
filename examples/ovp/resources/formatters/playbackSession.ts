import jsonapi, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'

export type PlaybackSessionType = 'PlaybackSession'

export type PlaybackSessionFields = {
  url: Attribute.Required<string>
}

export type PlaybackSessionResource = ResourceFormatter<PlaybackSessionType, PlaybackSessionFields>

export const playbackSession: PlaybackSessionResource = jsonapi.resource('PlaybackSession', {
  url: Attribute.required(string),
})
