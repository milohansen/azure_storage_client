import { AzureStorage } from './storage.ts'

export class Queue {
  #storage: AzureStorage
  #name: string

  get storage() {
    return this.#storage
  }
  get name() {
    return this.#name
  }

  constructor(storage: AzureStorage, name: string) {
    this.#storage = storage
    this.#name = name
  }

  put(message: string) {
    let data = `<QueueMessage><MessageText>${message}</MessageText></QueueMessage>`
    console.log('data:', data)
    return this.fetch('post', `${this.name}/messages`, data)
  }

  async fetch(
    method: string,
    url: string,
    data?: string,
    headers?: Record<string, string>
  ): Promise<Response> {
    let date = new Date().toUTCString()

    let requestHeaders: Record<string, string> = {
      'x-ms-date': date,
      'x-ms-version': '2021-04-10',
    }
    let option: RequestInit = { method }

    if (
      method.toLowerCase() === 'post' ||
      method.toLowerCase() === 'put' ||
      method.toLowerCase() === 'merge'
    ) {
      option.body = data
      let blob = new Blob([option.body], {type: 'text/plain'});
      requestHeaders['Content-Type'] = 'application/xml'
      requestHeaders['Content-Length'] = blob.size.toString()
    }
    if (headers) {
      for (let headerName in headers) {
        requestHeaders[headerName] = headers[headerName]
      }
    }

    requestHeaders.Authorization = await this.#storage.createAuthorization(method, url, requestHeaders, false)

    option.headers = requestHeaders
 
    return fetch(
      `https://${this.#storage.accountName}.queue.${this.#storage.endpointSuffix}/${url}`,
      option
    )
  }
}