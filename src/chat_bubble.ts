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
  private config: ChatBubbleConfig

  constructor(config: ChatBubbleConfig) {
    if (!config.userAgent.length) {
      throw('Required parameter missing: userAgent')
    }
    if (!config.botId.length) {
      throw('Required parameter missing: botId')
    }
    if (typeof window !== 'undefined') {
      config.locale = config.locale || window.navigator?.language
      config.timezone = config.timezone || window.Intl?.DateTimeFormat().resolvedOptions().timeZone
    }
    config.hostname = config.hostname || 'bsqd.me'

    this.config = config
  }

  getConfig() {
    return this.config
  }

  async connect() {
  }
}
