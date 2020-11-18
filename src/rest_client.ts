import { Config, PushService, API, UserInfo } from './types'

export namespace REST {
  /**
   * HTTP client for interacting with the Botsquad REST API
   */
  export class Client {
    private endpoint: string

    constructor(config: Config) {
      this.endpoint = `http${config.secure ? 's' : ''}://${config.hostname}/api`
    }

    public async getBotConfig(botId: string) {
      return this.request<void, API.BotResponse>('GET', botId)
    }

    public async getUserInfo(botId: string, userId: string) {
      return this.request<void, UserInfo>('GET', botId, `user/${userId}`)
    }

    public async leaveMessage(botId: string, request: API.LeaveMessageRequest) {
      return this.request<API.LeaveMessageRequest, API.OkResponse>(
        'POST',
        botId,
        'leave-message',
        request
      )
    }

    public async pushSubscribe(botId: string, userToken: string, type: PushService, data: any) {
      const request = {
        type,
        data,
        delegate_token: userToken
      }
      return this.request<API.PushRegisterRequest, API.OkResponse>(
        'POST',
        botId,
        'push_subscribe',
        request
      )
    }

    ///

    private async request<RQ, RS>(
      method: 'GET' | 'POST',
      botId: string,
      path?: string,
      request?: RQ
    ) {
      const body = request ? JSON.stringify(request) : undefined
      const endpoint = this.endpointUrl(botId, path)
      const params = { method, headers: { 'content-type': 'application/json' }, body }
      const result = await fetch(endpoint, params)
      if (result.status === 200) {
        return result.json() as Promise<RS>
      } else {
        return Promise.reject(new Error(`API request for ${endpoint} failed: ${result.status}`))
      }
    }

    private endpointUrl(botId: string, path?: string) {
      return `${this.endpoint}/bot/${botId}` + (path ? '/' + path : '')
    }
  }
}
