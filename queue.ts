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
    return this.fetch('post', `${this.name}/messages`, data)
  }

  get(visibilityTimeout?: number) {
    return this.fetch('get', `${this.name}/messages${visibilityTimeout !== undefined ? `?visibilitytimeout=${visibilityTimeout}` : ''}`)
  }

  message(messageId: string, popreceipt: string): QueueMessage {
    return new QueueMessage(this, messageId, popreceipt)
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
      data && (
        method.toLowerCase() === 'post' ||
        method.toLowerCase() === 'put' ||
        method.toLowerCase() === 'merge'
      )
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

export class QueueMessage {
  #queue: Queue
  #messageId: string
  #popreceipt: string

  get queue() {
    return this.#queue
  }

  get messageId() {
    return this.#messageId
  }

  get popreceipt() {
    return this.#popreceipt
  }

  delete() {
    return this.queue.fetch('delete', `${this.queue.name}/messages/${this.messageId}?popreceipt=${this.popreceipt}`)
  }

  update(visibilityTimeout: number, message: string | undefined) {
    let data = message ? `<QueueMessage><MessageText>${message}</MessageText></QueueMessage>` : undefined
    return this.queue.fetch('put', `${this.queue.name}/messages/${this.messageId}?popreceipt=${this.popreceipt}&visibilitytimeout=${visibilityTimeout}`, data)
  }
  
  constructor(queue: Queue, messageId: string, popreceipt: string) {
    this.#queue = queue
    this.#messageId = messageId
    this.#popreceipt = popreceipt
  }
}