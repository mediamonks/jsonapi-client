import { getDocumentMeta } from '@mediamonks/jsonapi-client'
import { useState } from 'react'
import { useClient } from '../../hooks/useClient'
import { useEndpoint } from '../../hooks/useEndpoint'
import { useManyResource } from '../../hooks/useManyResource'
import { book } from '../../resources'
import { bookListFilter, BooksList } from '../BooksList/BooksList'
import { Pagination } from '../Pagination/Pagination'
import { ResourceReader } from '../ResourceReader/ResourceReader'

const BOOKS_PAGE_SIZE = 12

type PageQuery = {
  number: number
  size?: number
}

type PaginationMeta = {
  page: number
  resources_per_page: number
  total_resources: number
}

const getBooksPageQuery = (page: number): PageQuery => ({ number: page, size: BOOKS_PAGE_SIZE })

export const App = () => {
  const client = useClient()
  const booksEndpoint = useEndpoint(client, 'books', book)

  const [page, setPage] = useState(1)

  const booksResource = useManyResource(booksEndpoint, bookListFilter, {
    page: getBooksPageQuery(page),
  })

  return (
    <div className="App">
      <ResourceReader resource={booksResource} fallback="Loading books...">
        {(books) => {
          const meta = getDocumentMeta<PaginationMeta>(books)
          const itemCount = Number(meta?.total_resources) || books.length
          const pageCount = Math.ceil(itemCount / BOOKS_PAGE_SIZE)

          return (
            <section>
              <BooksList books={books} />
              <Pagination currentPage={page} pageCount={pageCount} onPageChange={setPage} />
            </section>
          )
        }}
      </ResourceReader>
    </div>
  )
}
