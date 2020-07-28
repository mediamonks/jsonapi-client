import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { asset } from './asset'
import { stage } from './stage'

export type MediaResource = ResourceFormatter<
  'Media',
  {
    typeMedia: Attribute.Required<string>
    title: Attribute.Required<string>
    stage: Relationship.ToOne<typeof stage>
    assets: Relationship.ToMany<typeof asset>
  }
>

export const media: MediaResource = jsonapi.formatter('Media', {
  typeMedia: Attribute.required(string),
  title: Attribute.required(string),
  stage: Relationship.toOne(() => [stage]),
  assets: Relationship.toMany(() => [asset]),
})
