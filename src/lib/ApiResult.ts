import { isSome } from 'isntnt'

import {
  AnyApiResponseMeta,
  ApiResponseData,
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../types/data'
import { AnyResource } from './Resource'

type ApiResultResolver<
  T extends ApiResponseData<AnyResource>,
  M extends AnyApiResponseMeta
> = (
  accept: (response: ApiSuccessResponse<T, M>) => void,
  reject: (response: ApiErrorResponse<T, M>) => void,
) => void

export class ApiResult<
  T extends ApiResponseData<AnyResource>,
  M extends AnyApiResponseMeta
> {
  data: T | null = null
  errors: Array<any> = []
  meta!: M

  constructor(resolve: ApiResultResolver<T, M>) {
    resolve(
      ({ data, meta }: ApiSuccessResponse<T, M>) => {
        this.data = data
        this.meta = meta
      },
      ({ errors, meta }: ApiErrorResponse<T, M>) => {
        this.errors = errors
        this.meta = meta
      },
    )
  }

  isSuccess(): this is ApiResult<T, M> {
    return isSome(this.data)
  }

  [Symbol.iterator](): IterableIterator<T extends Array<any> ? T[number] : T> {
    return Array.isArray(this.data)
      ? this.data[Symbol.iterator]()
      : [this.data][Symbol.iterator]()
  }
}
