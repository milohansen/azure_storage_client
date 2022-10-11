import { AzureStorage } from './storage.ts'

export class Container {
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

  put(path: string, data: Blob | BufferSource, contentType: string): Promise<Response> {
    return this.fetch('put', `${this.#name}/${path}`, data, {
      'Content-Type': contentType
    })
  }

  get(path: string): Promise<Response> {
    return this.fetch('get', `${this.#name}/${path}`)
  }

  list(prefix?: string): Promise<Response> {
    return this.fetch('get', `${this.#name}?restype=container&comp=list` + (prefix ? `&prefix=${prefix as string}` : ''))
  }

  delete(path: string): Promise<Response> {
    return this.fetch('delete', `${this.#name}/${path}`)
  }

  async fetch(
    method: string,
    url: string,
    data?: Blob | BufferSource,
    headers?: Record<string, string>
  ): Promise<Response> {
    // TODO: content-md5

    await this.#storage.initialize()

    let date = new Date().toUTCString()
    let [, search] = url.split('?')
    let query = new URLSearchParams(search || '')

    let requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'x-ms-date': date,
      'x-ms-version': '2021-04-10'
    }
    let option: RequestInit = { method }

    if (method === 'put' && !query.has('comp')) {
      requestHeaders['x-ms-blob-type'] = 'BlockBlob'
      requestHeaders['Content-Length'] =
        (data instanceof Blob ? data.size : (data as ArrayBuffer).byteLength).toString()
    }
    if (headers) {
      for (let headerName in headers) {
        requestHeaders[headerName] = headers[headerName]
      }
    }

    requestHeaders.Authorization = await this.#storage.createAuthorization(method, url, requestHeaders)

    if (data) {
      option.body = data
    }
    option.headers = requestHeaders

    return fetch(
      `https://${this.#storage.accountName}.blob.${this.#storage.endpointSuffix}/${url}`,
      option
    )
  }
}