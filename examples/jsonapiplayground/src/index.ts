import JSONAPI, { ImplicitRelationshipData, AbsolutePathRoot } from 'jsonapi-client'

import { author, book } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = JSONAPI.client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  implicitRelationshipData: ImplicitRelationshipData.ResourceIdentifiers,
})

const authorEndpoint = client.endpoint('authors', author)

authorEndpoint
  .create({
    name: 'Hans',
    date_of_birth: new Date(1970, 0, 1),
    birthplace: 'Netherlands',
  })
  .then((oneAuthor) => {
    console.log(oneAuthor.data)
  })

const authorFilter = author.filter(
  {
    [author.type]: ['name', 'books'],
  },
  { books: null },
)

authorEndpoint.getOne('2', authorFilter).then((oneBook) => {
  console.log(oneBook.data)
})

const authorQuery = {
  page: {
    number: 1,
  },
}

authorEndpoint.getMany(authorQuery, authorFilter).then((manyBooks) => {
  console.log(manyBooks.data)
})
