import { Relationship, RelationshipField } from './relationship'
import { optionalFieldFlag, requiredFieldFlag } from '../../../test/fields'
import { RelationshipFieldType } from '../../data/enum'
import { formatterA } from '../../../test/formatters'

describe('RelationshipField', () => {
  it('is an RelationshipField constructor', () => {
    const relationshipField = new RelationshipField(
      requiredFieldFlag,
      RelationshipFieldType.ToOne,
      () => formatterA,
    )
    expect(relationshipField).toBeInstanceOf(RelationshipField)
  })
})

describe('Relationship', () => {
  describe('toOne', () => {
    it('creates an optional to-one relationship field', () => {
      const relationshipField = Relationship.toOne(() => formatterA)
      expect(relationshipField.relationshipType).toBe(RelationshipFieldType.ToOne)
      expect(relationshipField.isToOneRelationshipField()).toBe(true)
      expect(relationshipField.flag).toBe(optionalFieldFlag)
    })
  })

  describe('toMany', () => {
    it('creates an optional to-many relationship field', () => {
      const relationshipField = Relationship.toOne(() => formatterA)
      expect(relationshipField.relationshipType).toBe(RelationshipFieldType.ToOne)
      expect(relationshipField.isToOneRelationshipField()).toBe(true)
      expect(relationshipField.flag).toBe(optionalFieldFlag)
    })
  })
})
