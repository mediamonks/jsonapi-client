import JSONAPI, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { boolean, string } from '../attributes/primitive'
import { asset } from './asset'
import { OrganisationResource } from './organisation'
import { ParticipantResource } from './participant'
import { tag } from './tag'

export type CountryType = 'Country'

export type CountryFields = {
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
  flag: Relationship.ToOne<typeof asset>
  participants: Relationship.ToMany<ParticipantResource>
  tags: Relationship.ToMany<typeof tag>
}

export type CountryResource = ResourceFormatter<CountryType, CountryFields>

export const country: CountryResource = JSONAPI.resource('Country', {
  iso2Code: Attribute.optional(string),
  iso3Code: Attribute.required(string),
  iocCode: Attribute.required(string),
  isoName: Attribute.required(string),
  iocName: Attribute.required(string),
  localName: Attribute.optional(string),
  nameVariations: Attribute.optional(Type.array(string)),
  thumbnailUrl: Attribute.optional(string),
  isFeatured: Attribute.optional(boolean),
  organisation: Relationship.toOne(() => [] as any),
  flag: Relationship.toOne(() => [asset]),
  participants: Relationship.toMany(() => [] as any),
  tags: Relationship.toMany(() => [tag]),
})
