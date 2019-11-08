import { Socket, Channel, Presence } from 'phoenix'
import {
  Config,
  ConversationsJoinResponse,
  ConversationsListResponse
} from './types'

interface JoinResponse {
  userToken: string
  badgeCount: number
  context: Record<string, any>
}

export class Conversations {
  private channel: Channel
  private presence?: Presence
  private currentBadgeCount?: number

  constructor(socket: Socket, config: Config) {
    const { botId, userToken } = config
    this.channel = socket.channel(`conversations:${botId}`, { delegate_token: userToken })
  }

  async join(): Promise<JoinResponse> {
    const response = await this.joinChannel()
    this.presence = new Presence(this.channel)
    this.presence.onSync(this.syncPresence)
    const badgeCount = await this.getBadgeCount()

    return {
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

  private async joinChannel(): Promise<ConversationsJoinResponse> {
    return new Promise(resolve => {
      this.channel.join().receive('ok', resolve)
    })
  }

  private syncPresence = async () => {
    const badgeCount = await this.getBadgeCount()
    if (badgeCount !== this.currentBadgeCount) {
      // FIXME send badgeCount event
      this.currentBadgeCount = badgeCount
    }
  }

  private retrieveConversations(): Promise<ConversationsListResponse> {
    return new Promise(resolve => {
      this.channel.push('list_conversations', {}).receive('ok', resolve)
    })
  }

}
