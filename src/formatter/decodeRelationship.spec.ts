import { formatterA } from '../../test/formatters'
import { decodeRelationship } from './decodeRelationship'
import { Relationship } from '../resource/field/relationship'

describe('decodeRelationship', () => {
  it('returns a Validation Array', () => {
    const toOneRelationship = Relationship.toOne(() => formatterA)

    const validation = decodeRelationship(toOneRelationship, 'foo', {} as any, [], {}, {}, [])
    const [value, errors] = validation

    expect(validation).toBeInstanceOf(Array)
    expect(value).toBe(null)
    expect(errors).toBeInstanceOf(Array)
  })

  it.todo('returns a success validation when an relationship is not present')

  it.todo('returns a success validation when a to-one relationship is null')

  it.todo('returns a success validation when a to-one relationship is a resource')

  it.todo('returns a success validation when a to-many relationship is a resource[]')

  it.todo('returns a success validation when a relationship resource matches its field type')

  it.todo('returns a failure validation when a to-one relationship does not match its field type')

  it.todo('returns a failure validation when a to-many relationship does not match its field type')
})
