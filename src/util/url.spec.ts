import { formatterA } from '../../test/formatters'
import { Client } from '../client'
import { Endpoint } from '../client/endpoint'
import { createURL } from './url'

const exampleHref = 'https://example.com/api/'

describe('createUrl', () => {
  it('must return a url with the endpoint path appended if no params are provided', () => {
    const client = new Client(exampleHref)
    const endpoint = new Endpoint(client, 'test', formatterA)
    const output = createURL(endpoint)
    expect(output.href).toBe(`${exampleHref}test/`)
  })

  it('must append the provided path to the url', () => {
    const client = new Client(exampleHref)
    const endpoint = new Endpoint(client, 'test', formatterA)

    const output = createURL(endpoint, ['foo', 'bar'])
    expect(output.href).toBe(`${exampleHref}test/foo/bar/`)
  })

  it('must preserve the trailing slash from the client url', () => {
    const urlWithTrailingSlash = 'http://example.com/api/'
    const clientWithTrailingSlash = new Client(urlWithTrailingSlash)
    const endpointWithTrailingSlash = new Endpoint(clientWithTrailingSlash, 'test', formatterA)

    const outputWithTrailingSlash = createURL(endpointWithTrailingSlash)
    expect(outputWithTrailingSlash.href).toBe(`${urlWithTrailingSlash}test/`)

    const urlWithoutTrailingSlash = 'http://example.com/api'
    const clientWithoutTrailingSlash = new Client(urlWithoutTrailingSlash)
    const endpointWithoutTrailingSlash = new Endpoint(
      clientWithoutTrailingSlash,
      'test',
      formatterA,
    )

    const outputWithoutTrailingSlash = createURL(endpointWithoutTrailingSlash)
    expect(outputWithoutTrailingSlash.href).toBe(`${urlWithoutTrailingSlash}/test`)
  })

  it('must support nested endpoint paths', () => {
    const urlWithTrailingSlash = 'http://example.com/api/'
    const clientWithTrailingSlash = new Client(urlWithTrailingSlash)
    const endpointWithTrailingSlash = new Endpoint(clientWithTrailingSlash, 'foo/bar', formatterA)

    const outputWithTrailingSlash = createURL(endpointWithTrailingSlash)
    expect(outputWithTrailingSlash.href).toBe(`${urlWithTrailingSlash}foo/bar/`)

    const urlWithoutTrailingSlash = 'http://example.com/api'
    const clientWithoutTrailingSlash = new Client(urlWithoutTrailingSlash)
    const endpointWithoutTrailingSlash = new Endpoint(
      clientWithoutTrailingSlash,
      'foo/bar',
      formatterA,
    )

    const outputWithoutTrailingSlash = createURL(endpointWithoutTrailingSlash)
    expect(outputWithoutTrailingSlash.href).toBe(`${urlWithoutTrailingSlash}/foo/bar`)
  })
})
