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

  dir(path: string) {
    return new ContainerDirectory(this, path)
  }

  file(path: string) {
    return new ContainerFile(this, path)
  }

  list(): Promise<Response> {
    return this.fetch('get', `${this.#name}?restype=container&comp=list`)
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

export class ContainerDirectory {
  #container: Container
  #path: string

  constructor(container: Container, path: string) {
    this.#container = container
    this.#path = path
  }

  get container() {
    return this.#container
  }

  get path() {
    return this.#path
  }

  file(path: string) {
    return new ContainerFile(this.#container, this.#path + '/' + path)
  }

  list(): Promise<Response> {
    return this.container.fetch('get', `${this.#container.name}?restype=container&comp=list` + (this.#path ? `&prefix=${this.#path as string}` : ''))
  }
}

export class ContainerFile {
  #container: Container
  #path: string

  constructor(container: Container, path: string) {
    this.#container = container
    this.#path = path
  }

  get container() {
    return this.#container
  }

  get path() {
    return this.#path
  }

  put(data: Blob | BufferSource, contentType: string): Promise<Response> {
    return this.#container.fetch('put', `${this.#container.name}/${this.#path}`, data, {
      'Content-Type': contentType
    })
  }

  get(): Promise<Response> {
    return this.#container.fetch('get', `${this.#container.name}/${this.#path}`)
  }

  delete(): Promise<Response> {
    return this.#container.fetch('delete', `${this.#container.name}/${this.#path}`)
  }
}
