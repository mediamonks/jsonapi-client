import { getFilterRelationshipFieldNames } from './getFilterRelationshipFieldNames'
import { formatterA, formatterB } from '../../test/formatters'

describe('getFilterRelationshipFieldNames', () => {
  it('returns all readable relationship field names for each provided resource', () => {
    const fieldNames = getFilterRelationshipFieldNames([formatterA, formatterB], {})
    expect(fieldNames).toEqual(['toOneRelationship', 'toManyRelationship', 'toOneA'])
  })
})
