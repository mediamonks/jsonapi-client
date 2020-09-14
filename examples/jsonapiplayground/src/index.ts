import 'regenerator-runtime/runtime'
import JSONAPI, { AbsolutePathRoot, RelationshipFieldData } from '../../../src'

import { author, book, chapter, series } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = JSONAPI.client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  initialRelationshipData: RelationshipFieldData.ResourceIdentifiers,
})

const authors = client.endpoint('authors', author)
const books = client.endpoint('books', book)
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
      console.log('Created', oneAuthor)
    })

0 &&
  authors
    .update({
      type: 'authors',
      id: '1',
      name: 'Jane',
      books: [{ type: 'books', id: '4' }],
    })
    .then(() => {
      console.log('Updated Author')
    })

const authorFilter = author.filter({
  fields: {
    [author.type]: ['name', 'books', 'photos'],
    [book.type]: ['title', 'chapters'],
  },
  include: {
    books: null,
    photos: null,
  },
})

0 &&
  authors.getOne('4', authorFilter).then((data) => {
    console.log('One Author', data)
  })

const bookFilter = book.filter({
  fields: {
    [book.type]: ['title', 'chapters', 'series'],
    [series.type]: ['title', 'books'],
  },
  include: {
    series: null,
  },
})

1 &&
  books.getOne('28', bookFilter).then((data) => {
    console.log('Book', data)
    console.log('Book Links', books.getResourceLinks(data))
    console.log('Book Document Meta', books.getDocumentMeta(data))
    console.log('Book Resource Meta', books.getResourceMeta(data))
  })

const chapterQuery = {
  page: {
    size: 20,
  },
}

const chapterFilter = chapter.filter({
  fields: {
    [chapter.type]: ['book'],
    [book.type]: ['title', 'author'],
    [author.type]: ['name'],
  },
  include: {
    book: {
      author: null,
    },
  },
})

1 &&
  chapters.getMany(chapterQuery, chapterFilter).then((data) => {
    console.log('Chapters', data[1].book)
    console.log('Chapters Meta', chapters.getDocumentMeta(data))
    console.log('First Chapter Meta', chapters.getResourceMeta(data[0]))
    console.log('Chapters Has Next Page', chapters.hasNext(data))
  })

const getOneBookWithAuthor = books.one({
  fields: {
    books: ['author'],
  },
  include: {
    author: null,
  },
})
