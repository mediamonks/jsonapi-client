import { MockResourceRepository } from './repository'

export type MockFetchSetup = {
  repositories: ReadonlyArray<MockResourceRepository<any>>
  latency?: number | (() => number)
}

export const createMockFetch = ({ repositories, latency = 0 }: MockFetchSetup) => {
  return async function mockFetch(info: RequestInfo): Promise<Response> {
    await sleep(typeof latency === 'function' ? latency() : latency)

    const url = new URL((info as Request).url)
    const [path, id] = url.pathname.split('/').filter(Boolean)

    const mockRepository = repositories.find((repository) => repository.path === path)
    const result = mockRepository
      ? id
        ? mockRepository.getOne(url, id)
        : mockRepository.getMany(url)
      : null

    const ok = result != null

    const statusText = ok ? 'Success' : 'Not Found'

    const data = ok
      ? result
      : {
          errors: [
            {
              title: 'Not Found',
              detail:
                id != null
                  ? `Resource at "${path}" with id "${id}" not found in mocks`
                  : `Path "${path}" does not exist in mocks`,
            },
          ],
        }

    return {
      ok,
      statusText,
      async json() {
        return data
      },
    } as Response
  }
}

async function sleep(duration: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}
