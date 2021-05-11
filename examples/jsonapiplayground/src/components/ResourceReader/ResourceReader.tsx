import { ReactNode, Suspense } from 'react'
import { Resource } from '../../hooks/useResource'

interface ResourceReaderProps<T> {
  resource: Resource<T>
  children: (value: T) => ReactNode
  fallback?: ReactNode
}

export const ResourceReader = <T extends unknown>({
  resource,
  children,
  fallback,
}: ResourceReaderProps<T>) => {
  return fallback ? (
    <Suspense fallback={fallback}>
      <ResourceReaderChildren resource={resource}>{children}</ResourceReaderChildren>
    </Suspense>
  ) : (
    <ResourceReaderChildren resource={resource}>{children}</ResourceReaderChildren>
  )
}

interface ResourceReaderChildrenProps<T> {
  resource: Resource<T>
  children: (value: T) => ReactNode
}

const ResourceReaderChildren = <T extends unknown>({
  resource,
  children,
}: ResourceReaderChildrenProps<T>) => <>{children(resource())}</>
