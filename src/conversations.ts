import { Socket, Channel, Presence } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { promisify } from './channel'

import { Config, UserInfo, Event, API, ConversationsUpdatePayload } from './types'

export namespace Conversations {
  type OnEvent = SimpleEventDispatcher<Event>

  export class Manager {
    private channel: Channel
    private presence?: Presence
    private onConversationsUpdate = new SimpleEventDispatcher<ConversationsUpdatePayload>()
    public onEvent: OnEvent
    private lastConversationsPayload?: ConversationsUpdatePayload

    constructor(socket: Socket, config: Config, onEvent: OnEvent) {
      let { botId, userToken, userId } = config
      userToken = typeof userToken === 'string' && userToken.length ? userToken : undefined

      let params = {}
      if (typeof userId === 'string' && userId.length) {
        params = { user_id: userId }
      } else if (typeof userToken === 'string' && userToken.length) {
        params = { delegate_token: userToken }
      }

      this.onEvent = onEvent
      this.channel = socket.channel(`conversations:${botId}`, params)
      this.channel.on('event', this.onReceiveEvent)
    }

    async join(): Promise<API.ConversationsJoinResponse> {
      const response = await this.joinChannel()
      this.presence = new Presence(this.channel)
      this.presence.onSync(this.syncPresence)
      await this.syncPresence()

      return {
        userId: response.user_id,
        userToken: response.delegate_token,
        userInfo: response.user
      }
    }

    putUserInfo(info: UserInfo) {
      return promisify<UserInfo>(() => this.channel.push('put_user_info', { info }))
    }

    getOnConversationsUpdate() {
      setImmediate(() => {
        if (this.lastConversationsPayload) {
          this.onConversationsUpdate.dispatch(this.lastConversationsPayload)
        }
      })
      return this.onConversationsUpdate.asEvent()
    }

    async closeConversation(g: string) {
      return promisify<void>(() => this.channel.push('bury_conversation', { g })).then(() =>
        this.syncPresence()
      )
    }

    ///

    private async joinChannel() {
      return promisify<API.ConversationsChannelJoinResponse>(() => this.channel.join())
    }

    private syncPresence = async () => {
      const { conversations } = await promisify<API.ConversationsListResponse>(() =>
        this.channel.push('list_conversations', {})
      )

      const badgeCount = conversations.reduce(
        (count, conversation) => conversation.unread_message_count + count,
        0
      )

      const badgeConversation = conversations.reduce(
        (g, conv) => g || (conv.unread_message_count > 0 ? conv.g : null),
        null as null | string
      )

      const payload = {
        conversations,
        badgeConversation,
        badgeCount
      }

      this.onConversationsUpdate.dispatch(payload)
      this.lastConversationsPayload = payload
    }

    private onReceiveEvent = ({ name, sender, json }: API.ChannelEvent) => {
      const event: Event = {
        name,
        sender,
        payload: JSON.parse(json)
      }
      this.onEvent.dispatch(event)
    }
  }
}
