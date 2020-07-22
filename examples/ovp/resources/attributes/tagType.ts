import { Type } from 'jsonapi-client'

export enum TagType {
  EntityReference = 'ENTITY_REFERENCE',
  OlympicDate = 'OLYMPIC_DATE',
  VODCategory = 'VOD_CATEGORY',
  FreeText = 'FREE_TEXT',
  PhotoCategory = 'PHOTO_CATEGORY',
  AssetCategory = 'ASSET_CATEGORY',
}

export const tagType: Type<TagType> = Type.either(...Object.values(TagType))
