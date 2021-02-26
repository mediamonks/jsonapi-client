import {
  assertFieldsFilter,
  assertIncludeFilterAndGetNestedFormatters,
  parseResourceFilter,
} from './parseResourceFilter'
import { ResourceFormatter } from '../formatter'
import { Relationship } from '../resource/field/relationship'
import { Attribute } from '../resource/field/attribute'
import { Type } from '../util/type'

describe('parseResourceFilter', () => {
  it('is a function', () => {
    expect(parseResourceFilter).toBeInstanceOf(Function)
  })

  it('returns an unmodified resource filter if its valid', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => foo),
    })
    const baz = new ResourceFormatter('Baz', {
      bars: Relationship.toMany(() => bar),
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

    expect(parseResourceFilter([baz], filter.fields, filter.include)).toEqual(filter)
  })

  it('returns an unmodified resource filter if its valid for a polymorphic formatter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => foo),
    })
    const baz = new ResourceFormatter('Baz', {
      bars: Relationship.toMany(() => bar),
    })

    const filter = {
      fields: {
        Baz: ['bars'],
        Bar: ['foo'],
      },
      include: {
        foo: null,
        bars: {
          foo: null,
        },
      },
    } as const

    expect(parseResourceFilter([foo, bar, baz], filter.fields, filter.include)).toEqual(filter)
  })
})

describe('assertFieldsFilter', () => {
  it('is a function', () => {
    expect(assertFieldsFilter).toBeInstanceOf(Function)
  })

  it('throws if a key of fields filter does not equal the type of any formatter', () => {
    const fieldsFilter = {
      Foo: [],
    }
    expect(() => assertFieldsFilter([], fieldsFilter as any)).toThrow()
  })

  it('throws if a fields filter value is not an Array', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: null as any,
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow()
  })

  it('throws if a fields filter value is an empty Array', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: [],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow()
  })

  it('throws if a fields filter item is not a string', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: [12],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow()
  })

  it('throws if a fields filter item equals type or id', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsTypeFilter = {
      Foo: ['type'],
    }
    expect(() => assertFieldsFilter([foo], fieldsTypeFilter as any)).toThrow()
    const fieldsIdFilter = {
      Foo: ['id'],
    }
    expect(() => assertFieldsFilter([foo], fieldsIdFilter as any)).toThrow()
  })

  it('throws if a fields filter item is not a formatter field name', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optional(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: ['baz'],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow()
  })

  it('throws if a fields filter item is not a readable field', () => {
    const foo = new ResourceFormatter('Foo', {
      bar: Attribute.optionalWriteOnly(Type.undefined as any),
    })
    const fieldsFilter = {
      Foo: ['bar'],
    }
    expect(() => assertFieldsFilter([foo], fieldsFilter as any)).toThrow()
  })
})

describe('assertIncludeFilterAndGetNestedFormatters', () => {
  it('is a function', () => {
    expect(assertIncludeFilterAndGetNestedFormatters).toBeInstanceOf(Function)
  })

  it('returns an array with every (nested) formatter from an includeFilter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => foo),
    })
    const baz = new ResourceFormatter('Baz', {
      bars: Relationship.toMany(() => bar),
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

    expect(() => assertIncludeFilterAndGetNestedFormatters([foo], {}, includeFilter, [])).toThrow()
  })

  it('throws if a key of a nested include filter does not equal the type of its formatter', () => {
    const foo = new ResourceFormatter('Foo', {})
    const bar = new ResourceFormatter('Bar', {
      foo: Relationship.toOne(() => foo),
    })
    const includeFilter = {
      foo: {
        bar: null,
      },
    }

    expect(() => assertIncludeFilterAndGetNestedFormatters([bar], {}, includeFilter, [])).toThrow()
  })
})
