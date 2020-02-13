import { array, isBoolean, isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Asset from './Asset'
import Organisation from './Organisation'
import Participant from './Participant'

export default class Country extends JSONAPI.resource('Country', 'countries')<Country> {
  @Attribute.optional(isString) public iso2Code!: string | null
  @Attribute.required(isString) public iso3Code!: string
  @Attribute.required(isString) public iocCode!: string
  @Attribute.required(isString) public isoName!: string
  @Attribute.required(isString) public iocName!: string
  @Attribute.optional(isString) public localName!: string | null
  @Attribute.optional(array(isString)) public nameVariations!: string[] | null
  @Attribute.optional(isString) public thumbnailUrl!: string | null
  @Attribute.optional(isBoolean) public isFeatured!: boolean | null
  @Relationship.toOne(() => Asset) public flag!: Asset | null
  @Relationship.toOne(() => Organisation) public organisation!: Organisation | null
  @Relationship.toMany(() => Participant) public participants!: Participant[]
}
