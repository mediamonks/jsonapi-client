import { isNumber, isString } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

export class Individual extends JSONAPI.resource('Individual')<Individual> {
  @Attribute.required(isString) public ambition!: string
  @Attribute.optional(isString) public clubName!: string | null
  @Attribute.required(isString) public coach!: string
  @Attribute.required(isString) public countryOfBirth!: string
  @Attribute.required(isString) public dateOfBirth!: string
  @Attribute.required(isString) public education!: string
  @Attribute.required(isString) public fullFamilyName!: string
  @Attribute.required(isString) public fullGivenName!: string
  @Attribute.required(isString) public gender!: string
  @Attribute.required(isString) public generalBiography!: string
  @Attribute.required(isNumber) public height!: number
  @Attribute.required(isString) public hero!: string
  @Attribute.required(isString) public hobbies!: string
  @Attribute.required(isString) public individualType!: string
  @Attribute.required(isString) public nationality!: string
  @Attribute.required(isString) public nickname!: string
  @Attribute.required(isString) public occupation!: string
  @Attribute.required(isString) public otherSports!: string
  @Attribute.required(isString) public placeOfBirth!: string
  @Attribute.required(isString) public profileImages!: string
  @Attribute.required(isString) public sportingDebut!: string
  @Attribute.required(isString) public startedCompeting!: string
  @Attribute.required(isNumber) public weight!: number
}
