import jsonapi, { Attribute, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'

export type PlaybackSessionResource = ResourceFormatter<
  'PlaybackSession',
  {
    url: Attribute.Required<string>
  }
>

export const playbackSession: PlaybackSessionResource = jsonapi.formatter('PlaybackSession', {
  url: Attribute.required(string),
})
