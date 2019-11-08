import { Socket, Channel } from 'phoenix'
import { Config, VisitorsJoinParams, VisitorsJoinResponse } from './types'
import { JoinResponse as ConversationsJoinResponse } from './conversations'

type JoinResponse = VisitorsJoinResponse

export class Visitors {
  private channel: Channel

  constructor(socket: Socket, config: Config, conversationInfo: ConversationsJoinResponse) {
    this.channel = socket.channel(`visitor:${config.botId}`, this.joinParams(config, conversationInfo))
    console.log(this.joinParams(config, conversationInfo));
  }

  async join(): Promise<JoinResponse> {
    return await this.joinChannel()
  }

  ///

  private joinParams(config: Config, conversationInfo: ConversationsJoinResponse): VisitorsJoinParams {
    return {
      visitor_id: conversationInfo.userId,
      user_agent: config.userAgent,
      locale: config.locale,
      timezone: config.timezone,
    }
  }

  private async joinChannel(): Promise<VisitorsJoinResponse> {
    return new Promise(resolve => {
      this.channel.join().receive('ok', resolve)

      // this.channel.on('nudge', this._onReceiveNudge)
      // this.channel.on('open_conversation', ({ g }))
    })
  }
}
