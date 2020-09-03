import 'regenerator-runtime/runtime'
import JSONAPI, { AbsolutePathRoot, InitialRelationshipData } from '../../../src'

import { author, book, chapter, series } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = JSONAPI.client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  initialRelationshipData: InitialRelationshipData.ResourceIdentifiers,
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
      console.log('Created', oneAuthor.data)
    })

0 &&
  authors
    .update({
      type: 'authors',
      id: '1',
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

0 &&
  authors.getOne('4', authorFilter).then((data) => {
    console.log('One Author', data)
  })

const bookFilter = book.filter(
  {
    [book.type]: ['title', 'chapters', 'series'],
    [series.type]: ['title', 'books'],
  },
  {
    series: null,
  },
)

1 &&
  books.getOne('28', bookFilter).then((data) => {
    console.log('One Book', data)
  })

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

0 &&
  chapters.getMany(chapterQuery, chapterFilter).then((data) => {
    console.log('Many Chapters', data[1].book)
  })
