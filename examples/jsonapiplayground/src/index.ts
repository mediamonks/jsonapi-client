import 'regenerator-runtime/runtime'
import JSONAPI, { AbsolutePathRoot, InitialRelationshipData, ResourcePatchData } from '../../../src'

import { author, book, chapter, photo } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = JSONAPI.client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  initialRelationshipData: InitialRelationshipData.ResourceIdentifiers,
})

const authors = client.endpoint('authors', author)
const photos = client.endpoint('photos', photo)
const chapters = client.endpoint('chapters', chapter)

0 &&
  authors
    .create({
      type: 'authors',
      name: 'John',
      date_of_birth: new Date(1970, 0, 1),
      birthplace: 'New Guinea',
      photos: [],
      books: [],
    })
    .then((oneAuthor) => {
      console.log('Created', oneAuthor.data)
    })

1 &&
  authors
    .update('1', {
      type: 'authors',
      name: 'Jane',
      // books: [{ type: 'books', id: '4' }],
    })
    .then(() => {
      console.log('Updated Author')
    })

const authorFilter = author.filter(
  {
    [author.type]: ['name', 'books', 'photos'],
    [book.type]: ['title', 'chapters'],
  },
  { books: null, photos: null },
)

// authors.getOne('4', authorFilter).then((oneAuthor) => {
//   console.log('One Author', oneAuthor.data)
// })

const chapterQuery = {
  page: {
    size: 20,
  },
}

const chapterFilter = chapter.filter(
  {
    [chapter.type]: ['book'],
    [book.type]: ['title', 'author'],
    [author.type]: ['name'],
  },
  {
    book: {
      author: null,
    },
  },
)

chapters.getMany(chapterQuery, chapterFilter).then((chapters) => {
  console.log('Many Chapters', chapters.data)
})
