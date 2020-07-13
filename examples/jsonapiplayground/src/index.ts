import { Client } from '../../../src'

import Author from './resources/Author'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = new Client(url, {
  initialResourceFields: 'none',
  initialRelationshipData: 'resource-identifiers',
  resources: {
    authors: Author,
  },
})

client.getOne(Author, '2').then((resource) => console.log(resource.data))

client
  .create(Author, {
    name: 'Hans',
    date_of_birth: new Date(1970, 0, 1),
    birthplace: 'Netherlands',
  })
  .then((author) => {
    console.log(author.data.date_of_death) // null
  })

const authorWithBooks = Author.parseResourceQuery(
  {
    authors: ['name', 'books'],
  },
  { books: null },
)

client.getOne(Author, '2', authorWithBooks).then((book) => console.log(book.data.name))

client.getMany(Author, null, authorWithBooks).then((books) => console.log(books.data.length))

const getAuthorsWithBooks = client.many(Author, authorWithBooks)

getAuthorsWithBooks({
  page: {
    number: 1,
  },
})

const getAuthorBooks = client.toMany(Author, 'books')

getAuthorBooks('1').then((books) => {
  console.log(books.data[0].date_published)
  if (books.hasNextPage()) {
    return getAuthorsWithBooks({
      page: {
        number: 2,
      },
    })
  }
})
