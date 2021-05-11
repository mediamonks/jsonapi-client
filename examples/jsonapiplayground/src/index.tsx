import { Client } from '@mediamonks/jsonapi-client'
import { StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { App } from './components/App/App'
import { ClientContext } from './hooks/useClient'

const apiClient = new Client('http://jsonapiplayground.reyesoft.com/v2/')

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
