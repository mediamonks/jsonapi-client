import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { boolean, string } from '../attributes/primitive'
import { asset } from './asset'
import { organisation } from './organisation'
import { participant } from './participant'
import { tag } from './tag'

export type CountryResource = ResourceFormatter<
  'Country',
  {
    iso2Code: Attribute.Optional<string>
    iso3Code: Attribute.Required<string>
    iocCode: Attribute.Required<string>
    isoName: Attribute.Required<string>
    iocName: Attribute.Required<string>
    localName: Attribute.Optional<string>
    nameVariations: Attribute.Optional<Array<string>>
    thumbnailUrl: Attribute.Optional<string>
    isFeatured: Attribute.Optional<boolean>
    organisation: Relationship.ToOne<typeof organisation>
    flag: Relationship.ToOne<typeof asset>
    participants: Relationship.ToMany<typeof participant>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const country: CountryResource = jsonapi.formatter('Country', {
  iso2Code: Attribute.optional(string),
  iso3Code: Attribute.required(string),
  iocCode: Attribute.required(string),
  isoName: Attribute.required(string),
  iocName: Attribute.required(string),
  localName: Attribute.optional(string),
  nameVariations: Attribute.optional(Type.array(string)),
  thumbnailUrl: Attribute.optional(string),
  isFeatured: Attribute.optional(boolean),
  organisation: Relationship.toOne(() => [organisation]),
  flag: Relationship.toOne(() => [asset]),
  participants: Relationship.toMany(() => [participant]),
  tags: Relationship.toMany(() => [tag]),
})
