import { Socket, Channel } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { Config, Nudge, Event, ExtendedNudgeResponse, Internal as I } from './types'
import { promisify } from './channel'
import * as packageJson from '../package.json'

export namespace Internal {
  type OnNudge = SimpleEventDispatcher<Nudge>
  type OnEvent = SimpleEventDispatcher<Event>

  export class Visitors {
    private channel: Channel
    public onNudge: OnNudge
    public onEvent: OnEvent

    constructor(socket: Socket, config: Config, conversationInfo: I.ConversationsJoinResponse, onNudge: OnNudge, onEvent: OnEvent) {
      this.onNudge = onNudge
      this.onEvent = onEvent
      this.channel = socket.channel(`visitor:${config.botId}`, this.joinParams(config, conversationInfo))
      this.channel.on('nudge', this.onReceiveNudge)
      this.channel.on('event', this.onReceiveEvent)
    }

    async join(): Promise<I.VisitorsJoinResponse> {
      return this.joinChannel()
    }

    async sendPageView(url: string, title: string) {
      return promisify<{}>(
        () => this.channel.push('page_view', { url, title })
      )
    }

    async sendPageScroll(percentage: number) {
      return promisify<{}>(
        () => this.channel.push('scroll', { percentage })
      )
    }

    async sendChatOpenState(open: boolean) {
      return promisify<{}>(
        () => this.channel.push('chat_open', { open })
      )
    }

    async nudgeResponse(nudge: Nudge, action: I.NudgeResponse, response?: ExtendedNudgeResponse): Promise<void> {
      const payload = { action, nudge_id: nudge.id, ...response }
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

    private onReceiveEvent = ({ name, sender, json }: I.VisitorsEvent) => {
      const event: Event = {
        name, sender, payload: JSON.parse(json)
      }
      this.onEvent.dispatch(event)
    }
  }
}
