// Mock Window Headers, Request
Object.assign(global, {
  fetch: () => Promise.resolve(),
  Headers: class MockHeaders {
    append() {}
  },
  Request: class MockRequest {
    constructor(public url: string, public options: any) {}
  },
})
