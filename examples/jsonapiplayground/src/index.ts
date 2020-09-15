import 'regenerator-runtime/runtime'
import JSONAPI, { AbsolutePathRoot, RelationshipFieldData } from '../../../src'
import { decodeDocument } from '../../../src/formatter/decodeDocument'

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
      type: author.type,
      name: 'John',
      date_of_birth: new Date(1970, 0, 1),
      birthplace: 'New Guinea',
    })
    .then((data) => {
      console.log('Created', data)
    })

0 &&
  authors
    .update({
      type: author.type,
      id: '1',
      name: 'Jane',
      books: [book.identifier('4')],
    })
    .then(() => {
      console.log('Updated Author')
    })

const authorsFilter = authors.filter({
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
  authors.getOne('2', authorsFilter).then((data) => {
    console.log('One Author', data)
  })

authors.getManyRelationship('7', 'photos')

const booksFilter = books.filter({
  fields: {
    [book.type]: ['title', 'chapters', 'series'],
    [series.type]: ['title', 'books'],
  },
  include: {
    series: null,
  },
})

0 &&
  books.getOne('28', booksFilter).then((data) => {
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

const chaptersFilter = chapters.filter({
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

0 &&
  chapters.getMany(chapterQuery, chaptersFilter).then((data) => {
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

0 &&
  getOneBookWithAuthor('1').then((data) => {
    console.log('Book With Author', data)
  })

try {
  const x = decodeDocument([book], {
    data: [
      {
        type: 'jemoer',
        id: 'ok',
      } as any,
    ],
  })
} catch (err) {
  console.dir(err)
}
