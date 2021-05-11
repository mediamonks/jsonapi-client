import { useEffect, useRef } from 'react'

export const useWillUnmount = (callback: () => void) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => callbackRef.current()
  }, [])
}
