import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { competitor } from './competitor'
import { tag } from './tag'

export type ResultType = 'Result'

export type ResultFields = {
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
  extendedInfo: Attribute.Optional<{}>
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
  extendedInfoMap: Attribute.Optional<{}>
  children: Relationship.ToMany<ResultResource>
  parent: Relationship.ToOne<ResultResource>
  competitor: Relationship.ToOne<typeof competitor>
  tags: Relationship.ToMany<typeof tag>
}

export type ResultResource = ResourceFormatter<ResultType, ResultFields>

export const result: ResultResource = {} as any
