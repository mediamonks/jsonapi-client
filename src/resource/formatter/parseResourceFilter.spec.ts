import {
  assertFieldsFilter,
  assertIncludeFilterAndGetNestedFormatters,
  parseResourceFilter,
} from './parseResourceFilter'
import { ResourceFormatter } from '.'
import { Relationship } from '../field/relationship'
import { Attribute } from '../field/attribute'
import { Type } from '../../type'

describe('parseResourceFilter', () => {
  it('is a function', () => {
    expect(parseResourceFilter).toBeInstanceOf(Function)
  })

  it('returns an empty ResourceFilter if there is none provided', () => {
    const foo = new ResourceFormatter('Foo', {})
    expect(parseResourceFilter([foo])).toEqual({})
  })

  it('returns an unmodified ResourceFilter if its valid', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => [foo]),
    })
    const baz = new ResourceFormatter('Baz', {
      bars: Relationship.toMany(() => [bar]),
    })

    const filter = {
      fields: {
        Baz: ['bars'],
        Bar: ['foo'],
      },
      include: {
        bars: {
          foo: null,
        },
      },
    } as const

    expect(parseResourceFilter([baz], filter)).toEqual(filter)
  })

  it('returns an unmodified ResourceFilter if its valid for a polymorphic formatter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => [foo]),
    })
    const baz = new ResourceFormatter('Baz', {
      bars: Relationship.toMany(() => [bar]),
    })

    const filter = {
      fields: {
        Baz: ['bars'],
        Bar: ['foo'],
      },
      include: {
        bars: {
          foo: null,
        },
      },
    } as const

    expect(parseResourceFilter([foo, bar, baz], filter)).toEqual(filter)
  })
})

describe('assertFieldsFilter', () => {
  it('is a function', () => {
    expect(assertFieldsFilter).toBeInstanceOf(Function)
  })

  it('throws if a key of fieldsFilter does not equal the type of any formatter', () => {
    const fieldsFilter = {
      Foo: [],
    }
    expect(() => assertFieldsFilter([], fieldsFilter as any)).toThrow(
      `ResourceFormatter with type "Foo" not found`,
    )
  })

  it('throws if a fieldsFilter value is not an Array', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: null as any,
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow(
      `Value in ResourceFieldsQuery for "Foo" must be an Array`,
    )
  })

  it('throws if a fieldsFilter value is an empty Array', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: [],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow(
      `Value in ResourceFieldsQuery for "Foo" must not be empty`,
    )
  })

  it('throws if a fieldsFilter item is not a string', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: [12],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow(
      `Value in ResourceFieldsQuery for "Foo" must be a string`,
    )
  })

  it('throws if a fieldsFilter item equals type or id', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsTypeFilter = {
      Foo: ['type'],
    }
    expect(() => assertFieldsFilter([foo], fieldsTypeFilter as any)).toThrow(
      `Value in ResourceFieldsQuery for "Foo" may not be "type" or "id"`,
    )
    const fieldsIdFilter = {
      Foo: ['id'],
    }
    expect(() => assertFieldsFilter([foo], fieldsIdFilter as any)).toThrow(
      `Value in ResourceFieldsQuery for "Foo" may not be "type" or "id"`,
    )
  })

  it('throws if a fieldsFilter item is not a formatter field name', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: ['baz'],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow(
      `Field "baz" in ResourceFieldsQuery for "Foo" does not exist`,
    )
  })

  it('throws if a fieldsFilter item is not a readable field', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optionalWriteOnly(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: ['bar'],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow(
      `Field "bar" in ResourceFieldsQuery for "Foo" has NeverGet flag`,
    )
  })
})

describe('assertIncludeFilterAndGetNestedFormatters', () => {
  it('is a function', () => {
    expect(assertIncludeFilterAndGetNestedFormatters).toBeInstanceOf(Function)
  })

  it('returns an array with every (nested) formatter from an includeFilter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => [foo]),
    })
    const baz = new ResourceFormatter('Baz', {
      bars: Relationship.toMany(() => [bar]),
    })

    const includeFilter = {
      bars: {
        foo: null,
      },
    }

    expect(assertIncludeFilterAndGetNestedFormatters([baz], {}, includeFilter, [])).toEqual([
      baz,
      bar,
      foo,
    ])
  })

  it('throws if a key of includeFilter does not equal the type of any formatter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const includeFilter = {
      bar: null,
    }

    expect(() => assertIncludeFilterAndGetNestedFormatters([foo], {}, includeFilter, [])).toThrow(
      `Field "bar" in ResourceIncludeQuery is not a relationship field on formatter of type "Foo"`,
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

    expect(() => assertIncludeFilterAndGetNestedFormatters([bar], {}, includeFilter, [])).toThrow(
      `Field "foo.bar" in ResourceIncludeQuery is not a relationship field on formatter of type "Foo"`,
    )
  })
})
