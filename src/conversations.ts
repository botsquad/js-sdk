import { Socket, Channel, Presence } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { promisify } from './channel'

import {
  Config,
  Internal as I
} from './types'

export namespace Internal {

  export class Conversations {
    private channel: Channel
    private presence?: Presence
    private currentBadgeCount?: number
    public onBadgeCountUpdate = new SimpleEventDispatcher<number>()

    constructor(socket: Socket, config: Config) {
      let { botId, userToken } = config
      userToken = typeof userToken === 'string' && userToken.length ? userToken : undefined
      this.channel = socket.channel(`conversations:${botId}`, { delegate_token: userToken })
    }

    async join(): Promise<I.ConversationsJoinResponse> {
      const response = await this.joinChannel()
      this.presence = new Presence(this.channel)
      this.presence.onSync(this.syncPresence)
      const badgeCount = await this.getBadgeCount()

      return {
        userId: response.user_id,
        userToken: response.delegate_token,
        badgeCount,
        context: {}
      }
    }

    ///

    private async getBadgeCount() {
      const { conversations } = await this.retrieveConversations()
      return conversations.reduce((count, conversation) => conversation.unread_message_count + count, 0)
    }

    private async joinChannel() {
      return promisify<I.ConversationsChannelJoinResponse>(
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

    private retrieveConversations() {
      return promisify<I.ConversationsListResponse>(
        () => this.channel.push('list_conversations', {})
      )
    }
  }
}
