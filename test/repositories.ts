import { MockResource, MockResourceRepository } from '../src/mock/repository'
import { FormatterA, formatterA, formatterB, FormatterB } from './formatters'

export type MockResourceA = MockResource<FormatterA>

export const repositoryA: MockResourceRepository<FormatterA> = new MockResourceRepository(
  'path-a',
  formatterA,
  {
    amount: 10,
    createMockResource(index: number): MockResourceA {
      return {
        type: 'a',
        id: String(index),
        data: {
          requiredString: 'required-attribute',
          optionalString: null,
          toOneB: MockResourceRepository.toOne(
            () => repositoryB,
            () => null,
          ),
          toManyA: MockResourceRepository.toMany(
            () => repositoryA,
            (resources) => resources.slice(0, 1),
          ),
        },
        meta: {},
      }
    },
  },
)

type MockResourceB = MockResource<FormatterB>

export const repositoryB = new MockResourceRepository('path-b', formatterB, {
  createMockResource(id: number): MockResourceB {
    return {
      type: 'b',
      id: String(id),
      data: {
        requiredString: 'bar',
        toOneA: () => null,
      },
      meta: {},
    }
  },
})
