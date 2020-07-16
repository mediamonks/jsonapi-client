import { Client } from './Client'
import { url } from '../../test/mocks'
import { Post } from '../../test/resources'
import { keys, HTTPRequestMethod } from '../utils/data'

describe('ApiController', () => {
  describe('encodeResource', () => {
    it('set the correct Resource type when type is passed', () => {
      const client = new Client(url)
      const result = client.controller.encodeResource(
        Post,
        { title: 'foo', type: Post.type } as any,
        keys(Post.fields),
        [],
      )

      expect(result.value.data).toEqual({ type: Post.type, attributes: { title: 'foo' } })
    })

    it('set the correct Resource type when type is omitted from the data', () => {
      const client = new Client(url)
      const result = client.controller.encodeResource(
        Post,
        { title: 'foo' } as any,
        keys(Post.fields),
        [],
      )

      expect(result.value.data).toEqual({ type: Post.type, attributes: { title: 'foo' } })
    })

    it('fail when the wrong Resource type is passed', () => {
      const client = new Client(url)
      const result = client.controller.encodeResource(
        Post,
        { title: 'foo', type: 'bar' } as any,
        keys(Post.fields),
        [],
      )

      expect(result.value[0].message).toEqual(`Invalid type for Resource of type ${Post.type}`)
    })
  })
  describe('handleRequest', () => {
    it('No Content - 204', async () => {
      const client = new Client(url, {
        fetchAdapter: () =>
          Promise.resolve({
            ok: true,
            status: 204,
            json: () => Promise.resolve(JSON.parse('')),
          } as any),
      })

      const result = await client.controller.handleRequest(url, HTTPRequestMethod.GET)
      expect(result.state).toEqual('accepted')
      expect(result.value).toEqual(null)
    })
  })
})
