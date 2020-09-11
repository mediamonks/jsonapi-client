import { isSome, isFunction } from 'isntnt'

import { MockResourceRepository } from './repository'

export type MockFetchSetup = {
  repositories: ReadonlyArray<MockResourceRepository<any>>
  latency?: number | (() => number)
}

export const createMockFetch = ({ repositories, latency = 0 }: MockFetchSetup) => {
  return async (info: RequestInfo): Promise<Response> => {
    const url = new URL((info as Request).url)
    const [path, id] = url.pathname.split('/').filter(Boolean)

    const mockRepository = repositories.find((repository) => repository.path === path)
    const result = mockRepository
      ? id
        ? mockRepository.getOne(url, id)
        : mockRepository.getMany(url)
      : null

    const ok = isSome(result)
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(
            ok
              ? ({
                  ok,
                  json() {
                    return Promise.resolve(result)
                  },
                } as any)
              : {
                  ok,
                  statusText: 'Not Found',
                  json() {
                    return Promise.resolve({
                      errors: [
                        {
                          title: 'Not Found',
                          detail: isSome(id)
                            ? `Resource at "${path}" with id "${id}" not found in mocks`
                            : `Path "${path}" does not exist in mocks`,
                        },
                      ],
                    })
                  },
                },
          )
        },
        isFunction(latency) ? latency() : latency,
      )
    })
  }
}
