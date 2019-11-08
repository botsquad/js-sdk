import { Socket, Channel } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { Config, Nudge, Internal as I } from './types'

export namespace Internal {
  type OnNudge = SimpleEventDispatcher<Nudge>

  export class Visitors {
    private channel: Channel
    public onNudge: OnNudge

    constructor(socket: Socket, config: Config, conversationInfo: I.ConversationsJoinResponse, onNudge: OnNudge) {
      this.onNudge = onNudge
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

    async nudgeResponse(nudge: Nudge, response: I.NudgeResponse): Promise<void> {
      const payload = { action: response, nudge_id: nudge.id }
      return new Promise(resolve => {
        this.channel.push('nudge_response', payload).receive('ok', resolve)
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
        this.channel.on('nudge', this.onReceiveNudge)

        // this.channel.on('open_conversation', ({ g }))
      })
    }

    private onReceiveNudge = ({ id, json }: I.VisitorsNudge) => {
      console.log('id', id)
      console.log('json', json)

      const nudge: Nudge = {
        id, ...JSON.parse(json)
      }
      this.onNudge.dispatch(nudge)
    }
  }
}
