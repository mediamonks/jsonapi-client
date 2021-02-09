import 'regenerator-runtime/runtime'
import { AbsolutePathRoot, Client, RelationshipFieldData } from '../../../src'
import { decodeDocument } from '../../../src/formatter/decodeDocument'

import { author, book, chapter, series } from './resources'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = new Client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  initialRelationshipData: RelationshipFieldData.ResourceIdentifiers,
})

const authors = client.endpoint('authors', author)
const books = client.endpoint('books', book)
const chapters = client.endpoint('chapters', chapter)

const createAuthorForm = document.querySelector('#create-author') as HTMLFormElement

const initCreateAuthorForm = (formElement: HTMLFormElement) => {
  const nameInput = formElement.querySelector('input[type=text]') as HTMLInputElement
  let name = ''

  nameInput.addEventListener('input', () => {
    name = nameInput.value
  })

  const submitButton = formElement.querySelector('button[type=submit]') as HTMLButtonElement

  formElement.addEventListener('submit', (event) => {
    event.preventDefault()
    submitButton.disabled = true
    console.log({ name })

    submitButton.disabled = false
  })
}

initCreateAuthorForm(createAuthorForm)

const getAuthorsButton = document.querySelector('#get-authors') as HTMLButtonElement

getAuthorsButton.addEventListener('click', () => {})

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

const authorsFilter = authors.filter(
  {
    [author.type]: ['name', 'books', 'photos'] as const,
    [book.type]: ['title', 'chapters'] as const,
  },
  {
    books: null,
    photos: null,
  },
)

authors.getOne('2', authorsFilter).then((data) => {
  console.log('One Author', data)
})

authors.getManyRelationship('7', 'photos')

const booksFilter = books.filter(
  {
    [book.type]: ['title', 'chapters', 'series'],
    [series.type]: ['title', 'books'],
  },
  {
    series: null,
  },
)

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

const chaptersFilter = chapters.filter(
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

getOneBookWithAuthor('1').then((data) => {
  console.log('Book With Author', data)
})
