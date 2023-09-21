import { Socket, Channel } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { Config, Nudge, Event, ExtendedNudgeResponse, API } from './types'
import { promisify } from './channel'

export namespace Visitors {
  type OnNudge = SimpleEventDispatcher<Nudge>
  type OnEvent = SimpleEventDispatcher<Event>

  export class Manager {
    private channel: Channel
    public onNudge: OnNudge
    public onEvent: OnEvent

    constructor(
      socket: Socket,
      config: Config,
      conversationInfo: API.ConversationsJoinResponse,
      onNudge: OnNudge,
      onEvent: OnEvent,
    ) {
      this.onNudge = onNudge
      this.onEvent = onEvent
      this.channel = socket.channel(
        `visitor:${config.botId}`,
        this.joinParams(config, conversationInfo),
      )
      this.channel.on('nudge', this.onReceiveNudge)
      this.channel.on('event', this.onReceiveEvent)
    }

    async join(): Promise<API.VisitorsJoinResponse> {
      return this.joinChannel()
    }

    async sendPageView(url: string, title: string) {
      return promisify<{}>(() => this.channel.push('page_view', { url, title }))
    }

    async sendPageScroll(percentage: number) {
      return promisify<{}>(() => this.channel.push('scroll', { percentage }))
    }

    async sendChatOpenState(open: boolean) {
      return promisify<{}>(() => this.channel.push('chat_open', { open }))
    }

    async nudgeResponse(
      nudge: Nudge,
      action: API.NudgeResponse,
      response?: ExtendedNudgeResponse,
    ): Promise<void> {
      const payload = { action, nudge_id: nudge.id, ...response }
      return promisify<void>(() => this.channel.push('nudge_response', payload))
    }

    ///

    private joinParams(
      config: Config,
      conversationInfo: API.ConversationsJoinResponse,
    ): API.VisitorsJoinParams {
      const params: API.VisitorsJoinParams = {
        visitor_id: conversationInfo.userId,
        user_agent: config.userAgent + ` (PACKAGE_NAME; PACKAGE_VERSION)`,
        locale: config.locale,
        timezone: config.timezone,
      }
      if (config.userInfo) {
        params.user_info = config.userInfo
      }
      return params
    }

    private async joinChannel(): Promise<API.VisitorsJoinResponse> {
      return promisify<API.VisitorsJoinResponse>(() => this.channel.join())
    }

    private onReceiveNudge = ({ id, title, json }: API.VisitorsNudge) => {
      const nudge: Nudge = {
        id,
        title,
        ...JSON.parse(json),
      }
      this.onNudge.dispatch(nudge)
    }

    private onReceiveEvent = ({ name, sender, json }: API.ChannelEvent) => {
      const event: Event = {
        name,
        sender,
        payload: JSON.parse(json),
      }
      this.onEvent.dispatch(event)
    }
  }
}
