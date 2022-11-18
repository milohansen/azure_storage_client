import { KeyVault } from './vault.ts'

type KeyVaultConfig = {
  tenantId: string,
  clientId: string,
  clientSecret: string
}

/**
 * Azure AD Application Client for Key Vault
 *
 * @remarks
 *
 * REST APIの解説: {@link https://docs.microsoft.com/ja-jp/rest/api/keyvault/}
 */
 export class AzureADApplication {
  #config: KeyVaultConfig
  #vaults: Map<string, KeyVault>
  #accessToken?: CryptoKey
  #expiresIn?: Date

  get accessToken() {
    return this.#accessToken
  }

  constructor(config: KeyVaultConfig) {
    this.#vaults = new Map()
    this.#config = config
  }

  vault(name: string) {
    if (!this.#vaults.has(name)) {
      this.#vaults.set(name, new KeyVault(this, name))
    }
    return this.#vaults.get(name) as KeyVault
  }

  async refresh(): Promise<void> {
    let limitDt = new Date()
    limitDt.setMinutes(limitDt.getMinutes() - 30)

    if (
      this.#config.clientSecret ||
      !this.#expiresIn ||
      limitDt > this.#expiresIn
    ) {
      const url = `https://login.microsoftonline.com/${this.#config.tenantId}/oauth2/v2.0/token`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': `application/x-www-form-urlencoded`
        },
        body: new URLSearchParams({
          client_id: this.#config.clientId,
          client_secret: this.#config.clientSecret,
          scope: 'https://vault.azure.net/.default',
          grant_type: 'client_credentials'
        })
      })
      const data = await response.json()
      this.#accessToken = data.access_token
      this.#expiresIn = new Date(response.headers.get('date') as string)
      this.#expiresIn.setSeconds(this.#expiresIn.getSeconds + data.expires_in)
    }
  }
}