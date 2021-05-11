import { ManyResourceDocument } from '@mediamonks/jsonapi-client'
import { book, BookFormatter } from '../../resources'

export const bookListFilter = book.createFilter({
  [book.type]: ['title'],
})

interface BooksListProps {
  books: ManyResourceDocument<BookFormatter, typeof bookListFilter>
}

export const BooksList = ({ books }: BooksListProps) => {
  return books.length > 0 ? (
    <ul>
      {books.map((book) => (
        <li key={book.id}>{book.title}</li>
      ))}
    </ul>
  ) : (
    <h1>No books found</h1>
  )
}
