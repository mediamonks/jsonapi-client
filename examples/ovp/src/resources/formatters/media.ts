import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/primitive'
import { asset, AssetResource } from './asset'
import { stage, StageResource } from './stage'

export type MediaResource = ResourceFormatter<
  'Media',
  {
    typeMedia: Attribute.Required<string>
    title: Attribute.Required<string>
    stage: Relationship.ToOne<StageResource>
    assets: Relationship.ToMany<AssetResource>
  }
>

export const media: MediaResource = new ResourceFormatter('Media', {
  typeMedia: Attribute.required(string),
  title: Attribute.required(string),
  stage: Relationship.toOne(() => stage),
  assets: Relationship.toMany(() => asset),
})
