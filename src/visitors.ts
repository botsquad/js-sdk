import { Socket, Channel } from 'phoenix'
import { Config, Internal as I } from './types'

export namespace Internal {
  export class Visitors {
    private channel: Channel

    constructor(socket: Socket, config: Config, conversationInfo: I.ConversationsJoinResponse) {
      this.channel = socket.channel(`visitor:${config.botId}`, this.joinParams(config, conversationInfo))
    }

    async join(): Promise<I.VisitorsJoinResponse> {
      return await this.joinChannel()
    }

    async sendPageView(url: string, title: string): Promise<void> {
      return new Promise(resolve => {
        this.channel.push('page_view', { url, title }).receive('ok', resolve)
      })
    }

    ///

    private joinParams(config: Config, conversationInfo: I.ConversationsJoinResponse): I.VisitorsJoinParams {
      return {
        visitor_id: conversationInfo.userId,
        user_agent: config.userAgent,
        locale: config.locale,
        timezone: config.timezone,
      }
    }

    private async joinChannel(): Promise<I.VisitorsJoinResponse> {
      return new Promise(resolve => {
        this.channel.join().receive('ok', resolve)

        // this.channel.on('nudge', this._onReceiveNudge)
        // this.channel.on('open_conversation', ({ g }))
      })
    }
  }
}
