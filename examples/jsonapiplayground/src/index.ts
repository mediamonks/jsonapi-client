import JSONAPI, { ImplicitRelationshipData, AbsolutePathRoot } from 'jsonapi-client'

import { author } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = JSONAPI.client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  implicitRelationshipData: ImplicitRelationshipData.ResourceIdentifiers,
})

const authors = client.endpoint('authors', author)

authors.getOne('2').then((resource) => console.log(resource.data))

authors
  .create({
    name: 'Hans',
    date_of_birth: new Date(1970, 0, 1),
    birthplace: 'Netherlands',
  })
  .then((author) => {
    console.log(author.data.date_of_death) // null
  })

const authorWithBooks = author.filter(
  {
    [author.type]: ['name', 'books'],
  },
  { books: null },
)

authors.getOne('2', authorWithBooks).then((book) => console.log(book.data.name))

authors.getMany(null, authorWithBooks).then((books) => console.log(books.data.length))

const getAuthorsWithBooks = authors.many(authorWithBooks)

getAuthorsWithBooks({
  page: {
    number: 1,
  },
})

const getAuthorBooks = authors.toMany('books')

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
