import 'regenerator-runtime/runtime'
import { AbsolutePathRoot, Client, RelationshipFieldData, Resource } from '../../../src'
import { book } from './resources'
import { createElement, render, useRef } from './view'

const url = new URL('http://jsonapiplayground.reyesoft.com/v2')

const client = new Client(url, {
  absolutePathRoot: AbsolutePathRoot.Client,
  initialRelationshipData: RelationshipFieldData.ResourceIdentifiers,
})

book.addEventListener('decode-base-resource', (event) => {
  console.log('book decode', event.value)

  const meta = book.getMeta<{ test: 1 }>(event.value)
  console.log({ meta })
})

const booksFilter = book.createFilter(
  {
    books: ['title', 'isbn', 'author'],
    authors: ['name'],
  },
  {
    author: null,
  },
)

const booksEndpoint = client.endpoint('books', book)

const App = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fetchBooksButtonRef = useRef<HTMLButtonElement | null>(null)

  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault()
    if (inputRef.current?.value) {
      console.log('submit', inputRef.current.value)
    }
  }

  const fetchBooks = async () => {
    if (fetchBooksButtonRef.current) {
      fetchBooksButtonRef.current.disabled = true
      try {
        const books = await booksEndpoint.getMany(null, booksFilter)
        console.log({ books })
      } catch (error) {
        console.log(error)
      }
      fetchBooksButtonRef.current.disabled = false
    }
  }

  return createElement('div', {}, [
    createElement('form', { onSubmit }, [
      createElement('label', {}, [
        createElement('input', {
          ref: inputRef,
          type: 'text',
          name: 'id',
          value: '',
          placeholder: 'id',
        }),
      ]),
      createElement('button', { type: 'submit' }, ['Send']),
      createElement('button', { type: 'button', onClick: clearInput }, ['Clear']),
    ]),
    createElement('hr', {}),
    createElement('button', { ref: fetchBooksButtonRef, type: 'button', onClick: fetchBooks }, [
      'Fetch books',
    ]),
  ])
}

const root = document.createElement('div')

console.log('root', { root })

document.body.appendChild(root)

render(createElement(App, {}), root)
