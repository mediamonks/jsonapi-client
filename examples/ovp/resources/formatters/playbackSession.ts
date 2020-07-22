import jsonapi, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'

export type PlaybackSessionResource = ResourceFormatter<
  'PlaybackSession',
  {
    url: Attribute.Required<string>
  }
>

export const playbackSession: PlaybackSessionResource = jsonapi.resource('PlaybackSession', {
  url: Attribute.required(string),
})
