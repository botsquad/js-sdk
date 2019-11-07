interface ChatBubbleConfig {
  botId: string
  userAgent: string

  locale?: string
  timezone?: string
  userToken?: string
  hostname?: string
  context?: Record<string, any>
}

export class ChatBubble {
  constructor(params: ChatBubbleConfig) {
    if (!params.userAgent.length) {
      throw('Required parameter missing: userAgent')
    }
    if (!params.botId.length) {
      throw('Required parameter missing: botId')
    }
  }
}
