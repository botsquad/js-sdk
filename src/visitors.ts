import { Socket, Channel } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { Config, Nudge, Internal as I } from './types'
import { promisify } from './channel'
import * as packageJson from '../package.json'

export namespace Internal {
  type OnNudge = SimpleEventDispatcher<Nudge>

  export class Visitors {
    private channel: Channel
    public onNudge: OnNudge

    constructor(socket: Socket, config: Config, conversationInfo: I.ConversationsJoinResponse, onNudge: OnNudge) {
      this.onNudge = onNudge
      this.channel = socket.channel(`visitor:${config.botId}`, this.joinParams(config, conversationInfo))
      this.channel.on('nudge', this.onReceiveNudge)
      // this.channel.on('open_conversation', ({ g }))
    }

    async join(): Promise<I.VisitorsJoinResponse> {
      return this.joinChannel()
    }

    async sendPageView(url: string, title: string) {
      return promisify<{}>(
        () => this.channel.push('page_view', { url, title })
      )
    }

    async nudgeResponse(nudge: Nudge, response: I.NudgeResponse): Promise<void> {
      const payload = { action: response, nudge_id: nudge.id }
      return promisify<void>(
        () => this.channel.push('nudge_response', payload)
      )
    }

    ///

    private joinParams(config: Config, conversationInfo: I.ConversationsJoinResponse): I.VisitorsJoinParams {
      return {
        visitor_id: conversationInfo.userId,
        user_agent: config.userAgent + ` (${packageJson.name}; ${packageJson.version})`,
        locale: config.locale,
        timezone: config.timezone,
      }
    }

    private async joinChannel(): Promise<I.VisitorsJoinResponse> {
      return promisify<I.VisitorsJoinResponse>(
        () => this.channel.join()
      )
    }

    private onReceiveNudge = ({ id, json }: I.VisitorsNudge) => {
      const nudge: Nudge = {
        id, ...JSON.parse(json)
      }
      this.onNudge.dispatch(nudge)
    }
  }
}
