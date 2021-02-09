import { Attribute, Relationship, ResourceFormatter, Type } from '../../../../../src'

import { string, uint } from '../attributes/primitive'
import { resultExtendedInfo, ResultExtendedInfo } from '../attributes/resultExtendedInfo'
import { resultExtendedInfoMap, ResultExtendedInfoMap } from '../attributes/resultExtendedInfoMap'
import { competitor, CompetitorResource } from './competitor'
import { tag, TagResource } from './tag'

export type ResultResource = ResourceFormatter<
  'Result',
  {
    resultType: Attribute.Optional<string>
    externalId: Attribute.Required<string>
    irm: Attribute.Optional<string>
    title: Attribute.Optional<string>
    status: Attribute.Required<string>
    ingestOrganisation: Attribute.Optional<string>
    qualificationMark: Attribute.Optional<string>
    rank: Attribute.Optional<number>
    penalty: Attribute.Optional<string>
    wlt: Attribute.Optional<string>
    pool: Attribute.Optional<string>
    valueType: Attribute.Optional<string>
    value: Attribute.Optional<string>
    totalValue: Attribute.Optional<string>
    extendedInfo: Attribute.Optional<ResultExtendedInfo>
    resultFor: Attribute.Optional<string>
    against: Attribute.Optional<string>
    externalRowKeyList: Attribute.Optional<Array<string>>
    won: Attribute.Optional<number>
    sortOrder: Attribute.Optional<number>
    universalIdsList: Attribute.Optional<Array<string>>
    competitorId: Attribute.Optional<string>
    played: Attribute.Optional<number>
    rankEqual: Attribute.Optional<string>
    diff: Attribute.Optional<string>
    ratio: Attribute.Optional<string>
    tied: Attribute.Optional<number>
    lost: Attribute.Optional<number>
    extendedInfoMap: Attribute.Optional<ResultExtendedInfoMap>
    children: Relationship.ToMany<ResultResource>
    parent: Relationship.ToOne<ResultResource>
    competitor: Relationship.ToOne<CompetitorResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const result: ResultResource = new ResourceFormatter('Result', {
  resultType: Attribute.optional(string),
  externalId: Attribute.required(string),
  irm: Attribute.optional(string),
  title: Attribute.optional(string),
  status: Attribute.required(string),
  ingestOrganisation: Attribute.optional(string),
  qualificationMark: Attribute.optional(string),
  rank: Attribute.optional(uint),
  penalty: Attribute.optional(string),
  wlt: Attribute.optional(string),
  pool: Attribute.optional(string),
  valueType: Attribute.optional(string),
  value: Attribute.optional(string),
  totalValue: Attribute.optional(string),
  extendedInfo: Attribute.optional(resultExtendedInfo),
  resultFor: Attribute.optional(string),
  against: Attribute.optional(string),
  externalRowKeyList: Attribute.optional(Type.array(string)),
  won: Attribute.optional(uint),
  sortOrder: Attribute.optional(uint),
  universalIdsList: Attribute.optional(Type.array(string)),
  competitorId: Attribute.optional(string),
  played: Attribute.optional(uint),
  rankEqual: Attribute.optional(string),
  diff: Attribute.optional(string),
  ratio: Attribute.optional(string),
  tied: Attribute.optional(uint),
  lost: Attribute.optional(uint),
  extendedInfoMap: Attribute.optional(resultExtendedInfoMap),
  children: Relationship.toMany(() => result),
  parent: Relationship.toOne(() => result),
  competitor: Relationship.toOne(() => competitor),
  tags: Relationship.toMany(() => tag),
})
