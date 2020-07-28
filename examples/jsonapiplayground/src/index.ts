import 'regenerator-runtime/runtime'
import jsonapi, { ImplicitRelationshipData, AbsolutePathRoot } from '../../../src'

import { author, book } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = jsonapi.client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  implicitRelationshipData: ImplicitRelationshipData.ResourceIdentifiers,
})

const authorEndpoint = client.endpoint('authors', author)

// authorEndpoint
//   .create({
//     type: 'authors',
//     name: 'Hans',
//     date_of_birth: new Date(1970, 0, 1),
//     birthplace: 'Netherlands',
//   })
//   .then((oneAuthor) => {
//     console.log(oneAuthor.data)
//   })

const authorFilter = author.filter(
  {
    [author.type]: ['name', 'books', 'photos'],
    [book.type]: ['title', 'chapters'],
  },
  { books: null, photos: null },
)

authorEndpoint.getOne('1', authorFilter).then((oneAuthor) => {
  console.log('getOne author', oneAuthor.data)
})
