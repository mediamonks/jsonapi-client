import { ResourceIdentifier } from './identifier'

describe('ResourceIdentifier', () => {
  describe('constructor', () => {
    it('must throw an Error if its first param (type) is not a string', () => {
      expect(() => new ResourceIdentifier(null as any, 'id')).toThrowError()
    })

    it('must throw an Error if its first param (type) is an empty string', () => {
      expect(() => new ResourceIdentifier('', 'id')).toThrowError()
    })

    it('must throw an Error if its first param (type) is not a valid ResourceType', () => {
      expect(() => new ResourceIdentifier('-Type-', 'id')).toThrowError()
    })

    it('must set its first param (type) to ResourceIdentifier#type unmodified if it’s a valid ResourceType', () => {
      const resourceIdentifier = new ResourceIdentifier('Type', 'id')
      expect(resourceIdentifier.type).toBe('Type')
    })

    it('must throw an Error if its second param (id) is not a string', () => {
      expect(() => new ResourceIdentifier('Type', null as any)).toThrowError()
    })

    it('must set its second param (id) to ResourceIdentifier#id unmodified if it’s a string', () => {
      const resourceIdentifier = new ResourceIdentifier('Type', 'id')
      expect(resourceIdentifier.id).toBe('id')
    })
  })
})
