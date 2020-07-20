import { resource } from '.'

describe('resource', () => {
  it('must be a function', () => {
    expect(resource).toBeInstanceOf(Function)
  })

  it.todo('must return a ResourceFormatter')
})
