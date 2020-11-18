import { Socket, Channel, Presence } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { promisify } from './channel'

import {
  Config,
  UserInfo,
  Event,
  API
} from './types'

export namespace Conversations {
  type OnEvent = SimpleEventDispatcher<Event>

  export class Manager {
    private channel: Channel
    private presence?: Presence
    private currentBadgeCount = 0
    public onBadgeCountUpdate = new SimpleEventDispatcher<number>()
    public onEvent: OnEvent

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
      this.currentBadgeCount = await this.getBadgeCount()

      return {
        userId: response.user_id,
        userToken: response.delegate_token,
        userInfo: response.user,
        badgeCount: this.currentBadgeCount,
      }
    }

    putUserInfo(info: UserInfo) {
      return promisify<UserInfo>(
        () => this.channel.push('put_user_info', { info })
      )
    }

    getCurrentBadgeCount() {
      return this.currentBadgeCount
    }

    async listConversations() {
      const { conversations } = await promisify<API.ConversationsListResponse>(
        () => this.channel.push('list_conversations', {})
      )
      return conversations
    }

    ///

    private async getBadgeCount() {
      const  conversations  = await this.listConversations()
      return conversations.reduce((count, conversation) => conversation.unread_message_count + count, 0)
    }

    private async joinChannel() {
      return promisify<API.ConversationsChannelJoinResponse>(
        () => this.channel.join()
      )
    }

    private syncPresence = async () => {
      const badgeCount = await this.getBadgeCount()
      if (badgeCount !== this.currentBadgeCount) {
        this.currentBadgeCount = badgeCount
        this.onBadgeCountUpdate.dispatch(badgeCount)
      }
    }

    private onReceiveEvent = ({ name, sender, json }: API.ChannelEvent) => {
      const event: Event = {
        name, sender, payload: JSON.parse(json)
      }
      this.onEvent.dispatch(event)
    }
  }
}
