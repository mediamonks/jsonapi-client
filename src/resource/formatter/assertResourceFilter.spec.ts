import { assertResourceFilter } from './assertResourceFilter'
import { ResourceFormatter } from '.'
import { Relationship } from '../field/relationship'

describe('assertResourceFilter', () => {
  it('is a function', () => {
    expect(assertResourceFilter).toBeInstanceOf(Function)
  })

  // it('throws if a ')

  it('throws if a key of includeFilter does not equal the type of any formatter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const includeFilter = {
      bar: null,
    }

    expect(() => assertResourceFilter([foo], {}, includeFilter, [])).toThrow(
      `Included field "bar" cannot be included because it is not a formatter field name (Foo)`,
    )
  })

  it('throws if a key of a nested includeFilter does not equal the type of its formatter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => [foo]),
    })
    const includeFilter = {
      foo: {
        bar: null,
      },
    }

    expect(() => assertResourceFilter([bar], {}, includeFilter, [])).toThrow(
      `Included field "foo.bar" cannot be included because it is not a formatter field name (Foo)`,
    )
  })

  it.todo(
    'throws if a key of fieldsFilter does not equal the type of any included formatter',
    // () => {
    //   const formatter = new ResourceFormatter('bar', {})
    //   const fieldsFilter = {
    //     foo: [] as any,
    //   }

    //   expect(() => assertResourceFilter([formatter], fieldsFilter, {}, [])).toThrow()
    // }
  )
})
