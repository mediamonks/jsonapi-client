import { Client } from '@mediamonks/jsonapi-client'
import { StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { App } from './components/App/App'
import { ClientContext } from './hooks/useClient'
import { book } from './resources'

const apiClient = new Client('http://jsonapiplayground.reyesoft.com/v2/', {
  transformRelationshipPath: (name) => name.toUpperCase(),
})

const booksEndpoint = apiClient.endpoint('books', book)

booksEndpoint.getToOne('1', 'series')

ReactDOM.render(
  <StrictMode>
    <ClientContext.Provider value={apiClient}>
      <Suspense fallback="Loading...">
        <App />
      </Suspense>
    </ClientContext.Provider>
  </StrictMode>,
  document.getElementById('root'),
)
