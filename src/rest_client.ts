import {
  Config,
  Internal as I
} from './types'

export namespace Internal {

  /**
   * HTTP client for interacting with the Botsquad REST API
   */
  export class RESTClient {
    private endpoint: string

    constructor(config: Config) {
      this.endpoint = `http${config.secure ? 's' : ''}://${config.hostname}/api/`
    }

    public async getBotConfig(botId: string) {
      return this.request<void, I.BotAPIResponse>("GET", botId)
    }

    public async pushSubscribe(botId: string, userToken: string, type: I.PushService, data: any) {
      const request = {
        type, data,
        delegate_token: userToken,
      }
      return this.request<I.PushRegisterAPIRequest, I.PushRegisterAPIResponse>("POST", botId, "push_subscribe", request)
    }

    ///

    private async request<RQ, RS>(method: "GET" | "POST", botId: string, path?: string, request?: RQ) {
      const body = request ? JSON.stringify(request) : undefined
      const endpoint = this.endpointUrl(botId, path)
      const params = { method, headers: { 'content-type': 'application/json'}, body }
      const result = await fetch(endpoint, params)
      return result.json() as Promise<RS>
    }

    private endpointUrl(botId: string, path?: string) {
      return `${this.endpoint}/bot/${botId}` + (path ? '/' + path : '')
    }
  }
}
