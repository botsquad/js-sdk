import { Socket } from 'phoenix'

interface Config {
  botId: string
  userAgent: string

  locale?: string
  timezone?: string
  userToken?: string
  hostname?: string
  secure?: boolean
  context?: Record<string, any>
}

interface ConnectResult {
  userToken: string
  badgeCount: number
  bot: {
    id: string
    title: string
    profilePicture: string
  }
  context: Record<string, any>
}

export class ChatBubble {
  private config: Config
  private socket: Socket

  constructor(config: Config) {
    if (!config.userAgent.length) {
      throw(new Error('Required parameter missing: userAgent'))
    }
    if (!config.botId.length) {
      throw(new Error('Required parameter missing: botId'))
    }
    if (window) {
      config.locale = config.locale || window.navigator?.language
      config.timezone = config.timezone || window.Intl?.DateTimeFormat().resolvedOptions().timeZone
    }
    config.hostname = config.hostname || 'bsqd.me'
    config.secure = typeof config.secure === 'undefined' ? true : !!config.secure

    const params = { user_token: config.userToken }
    this.socket = new Socket(`ws${config.secure ? 's' : ''}://${config.hostname}/socket`, { params })

    this.config = config
  }

  getConfig() {
    return this.config
  }

  async connect(): Promise<ConnectResult> {
    await this.connectSocket()

    const result: ConnectResult = {
        userToken: 'asfd',
        badgeCount: 123,
        bot: {
          id: this.config.botId,
          title: 'x',
          profilePicture: 'x' },
        context: {}
    }
    return result
  }

  ///

  private async connectSocket() {
    return new Promise(resolve => {
      this.socket.onOpen(resolve)
      this.socket.connect()
    })
  }
}
