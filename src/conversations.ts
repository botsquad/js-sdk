import { Socket, Channel, Presence } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'

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
      const { botId, userToken } = config
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

    private async joinChannel(): Promise<I.ConversationsChannelJoinResponse> {
      return new Promise(resolve => {
        this.channel.join().receive('ok', resolve)
      })
    }

    private syncPresence = async () => {
      const badgeCount = await this.getBadgeCount()
      if (badgeCount !== this.currentBadgeCount) {
        this.currentBadgeCount = badgeCount
        this.onBadgeCountUpdate.dispatch(badgeCount)
      }
    }

    private retrieveConversations(): Promise<I.ConversationsListResponse> {
      return new Promise(resolve => {
        this.channel.push('list_conversations', {}).receive('ok', resolve)
      })
    }
  }
}
