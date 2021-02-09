import { Attribute, Relationship, ResourceFormatter, Type } from '../../../../../src'

import { boolean, string } from '../attributes/primitive'
import { asset, AssetResource } from './asset'
import { organisation, OrganisationResource } from './organisation'
import { participant, ParticipantResource } from './participant'
import { tag, TagResource } from './tag'

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
    organisation: Relationship.ToOne<OrganisationResource>
    flag: Relationship.ToOne<AssetResource>
    participants: Relationship.ToMany<ParticipantResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const country: CountryResource = new ResourceFormatter('Country', {
  iso2Code: Attribute.optional(string),
  iso3Code: Attribute.required(string),
  iocCode: Attribute.required(string),
  isoName: Attribute.required(string),
  iocName: Attribute.required(string),
  localName: Attribute.optional(string),
  nameVariations: Attribute.optional(Type.array(string)),
  thumbnailUrl: Attribute.optional(string),
  isFeatured: Attribute.optional(boolean),
  organisation: Relationship.toOne(() => organisation),
  flag: Relationship.toOne(() => asset),
  participants: Relationship.toMany(() => participant),
  tags: Relationship.toMany(() => tag),
})
