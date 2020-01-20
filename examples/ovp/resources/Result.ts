import { array, isBoolean, isNumber, isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Competitor } from './Competitor'

const isExtendedInfoMap = shape({
  value: isString,
})

export class Result extends JSONAPI.resource('Result')<Result> {
  @Attribute.optional(isString) public irm!: string | null
  @Attribute.required(isString) public status!: string
  @Attribute.required(isString) public externalId!: string
  @Attribute.optional(isString) public ingestOrganisation!: string | null
  @Attribute.optional(isString) public qualificationMark!: string | null
  @Attribute.optional(isNumber) public rank!: number | null
  @Attribute.optional(isString) public penalty!: string | null
  @Attribute.optional(isString) public wlt!: string | null
  @Attribute.optional(isString) public pool!: string | null
  @Attribute.optional(isString) public totalValue!: string | null
  @Attribute.optional(isString) public valueType!: string | null
  @Attribute.optional(isString) public extendedInfo!: string | null
  @Attribute.optional(isString) public resultFor!: string | null
  @Attribute.optional(isString) public title!: string | null
  @Attribute.optional(array(isString)) public externalRowKeyList!: string[] | null
  @Attribute.optional(isBoolean) public won!: boolean | null
  @Attribute.optional(isNumber) public sortOrder!: number | null
  @Attribute.optional(isString) public value!: string | null
  @Attribute.optional(array(isString)) public universalIdsList!: string[] | null
  @Attribute.optional(isString) public competitorId!: string | null
  @Attribute.optional(isBoolean) public played!: boolean | null
  @Attribute.optional(isString) public rankEqual!: string | null
  @Attribute.optional(isString) public diff!: string | null
  @Attribute.optional(isString) public ratio!: string | null
  @Attribute.optional(isBoolean) public tied!: boolean | null
  @Attribute.optional(isBoolean) public lost!: boolean | null
  @Attribute.required(isString) public resultType!: string
  @Attribute.optional(isExtendedInfoMap) public extendedInfoMap!: Static<
    typeof isExtendedInfoMap
  > | null
  @Relationship.toMany(() => Result) public children!: Result[]
  @Relationship.toOne(() => Result) public parent!: Result | null
  @Relationship.toOne(() => Competitor) public competitor!: Competitor | null
}
