import { createURL } from './url'

const exampleHref = 'https://example.com/api/test/'

describe('createUrl', () => {
  it('must return a cloned url if an empty path is provided', () => {
    const input = new URL(exampleHref)
    const output = createURL(input, [])
    expect(input).not.toBe(output)
    expect(output.href).toBe(input.href)
  })

  it('must append the provided path to the url', () => {
    const input = new URL(exampleHref)
    const output = createURL(input, ['foo', 'bar'])
    expect(output.href).toBe(`${input.href}foo/bar/`)
  })
})
