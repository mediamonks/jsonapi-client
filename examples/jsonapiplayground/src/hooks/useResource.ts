import { useCallback, useEffect, useRef, useState } from 'react'
import { useWillUnmount } from './useWillUnmount'

type Lazy<T> = () => T | Promise<T>

type PendingResult<T> = readonly [status: 'pending', value: Promise<T>]
type SuccessResult<T> = readonly [status: 'success', value: T]
type FailureResult = readonly [status: 'failure', value: unknown]

type Result<T> = PendingResult<T> | SuccessResult<T> | FailureResult

const PENDING_PROMISE: Promise<any> = new Promise(() => {})
const PENDING_RESULT: PendingResult<any> = ['pending', PENDING_PROMISE]

export interface Resource<T> {
  (): T
}

export const useResource = <T>(fetchResource: Lazy<T>): Resource<T> => {
  const [result, setResult] = useState<Result<T>>(PENDING_RESULT)
  const promiseRef = useRef<Promise<T>>(PENDING_PROMISE)

  const willUnmountRef = useRef(false)
  useWillUnmount(() => {
    willUnmountRef.current = true
  })

  useEffect(() => {
    const promise = Promise.resolve(fetchResource())
    setResult(['pending', promise] as const)
  }, [fetchResource])

  useEffect(() => {
    const [status, value] = result
    if (status === 'pending') {
      const promise = (promiseRef.current = value as Promise<T>)
      promise
        .then((value) => ['success', value] as const)
        .catch((value) => ['failure', value] as const)
        .then((result) => {
          if (!willUnmountRef.current && promiseRef.current === promise) {
            setResult(result)
          }
        })
    }
  }, [result])

  return useCallback(() => {
    const [status, value] = result
    switch (status) {
      case 'pending':
      case 'failure':
        throw value
      default:
        return value as T
    }
  }, [result])
}
