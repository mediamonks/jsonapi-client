import { formatterA } from '../../test/formatters'

import { Client } from '../client'
import { Endpoint } from './endpoint'

const client = new Client(new URL('https://example.com/api'))
const endpoint = new Endpoint(client, 'path', formatterA)

describe('Endpoint', () => {
  it.todo('is an Endpoint constructor')

  describe('#getOne', () => {
    it.todo('throws an error if an invalid resource is retrieved')
  })

  describe('#filter', () => {
    it('returns a parsed resource filter', () => {
      const filter = {
        fields: {
          a: ['requiredAttribute', 'toOneRelationship', 'toManyRelationship'],
          b: ['foo'],
        },
        include: {
          toOneRelationship: null,
          toManyRelationship: null,
        },
      } as const
      expect(endpoint.filter(filter)).toEqual(filter)
    })

    it('throws when an invalid filter is provided', () => {
      expect(() =>
        endpoint.filter({
          fields: {
            a: [],
          },
        } as any),
      ).toThrow()
      expect(() =>
        endpoint.filter({
          fields: {
            a: ['does not exist'],
          },
        } as any),
      ).toThrow()
      expect(() =>
        endpoint.filter({
          include: {
            doesNotExist: null,
          },
        } as any),
      ).toThrow()
      expect(() =>
        endpoint.filter({
          include: true,
        } as any),
      ).toThrow()
    })
  })
})
