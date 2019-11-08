import { Socket } from 'phoenix'
import 'whatwg-fetch'

import {
  Config,
  ConnectResult,
  BotAPIResponse,
 } from './types'
import { Conversations } from './conversations'
import { Visitors } from './visitors'

type PageView = { url: string, title: string }

export class ChatBubble {
  private config: Config
  private socket: Socket
  private conversations: Conversations
  private visitors?: Visitors
  private pendingPageViews: PageView[] = []

  constructor(config: Config) {
    if (!config.userAgent.length) {
      throw(new Error('Required parameter missing: userAgent'))
    }
    if (!config.botId.length) {
      throw(new Error('Required parameter missing: botId'))
    }
    if (window) {
      config.locale = (config.locale || window.navigator?.language).replace('-', '_')
      config.timezone = config.timezone || window.Intl?.DateTimeFormat().resolvedOptions().timeZone
    }
    config.hostname = config.hostname || 'bsqd.me'
    config.secure = typeof config.secure === 'undefined' ? true : !!config.secure

    this.socket = new Socket(`ws${config.secure ? 's' : ''}://${config.hostname}/socket`)
    this.conversations = new Conversations(this.socket, config)
    this.config = config
  }

  getConfig() {
    return this.config
  }

  async connect(): Promise<ConnectResult> {
    // retrieve bot config, connect
    const [bot,] = await Promise.all<BotAPIResponse, void>([this.getBotConfig(), this.connectSocket()])


    // join conversations channel (for badge count, context and delegate token)
    const joinResponse = await this.conversations.join()
    const { userToken, badgeCount, context } = joinResponse

    this.visitors = new Visitors(this.socket, this.config, joinResponse)
    await this.visitors.join()

    // send any pending pageview
    this.pendingPageViews.forEach(({ url, title }) => this.sendPageView(url, title))
    this.pendingPageViews = []

    // if we have context in the config, push it over the conversations channel now.

    return {
      userToken,
      badgeCount,
      context,
      bot: {
        id: bot.id,
        title: bot.title,
        profilePicture: bot.profile_picture
      }
    }
  }

  async disconnect(): Promise<void> {
    return new Promise(
      resolve => {
        if (!this.socket.isConnected()) {
          resolve()
        } else {
          this.socket.disconnect(resolve)
        }
      }
    )
  }

  async sendPageView(url: string, title: string) {
    if (!this.visitors) {
      this.pendingPageViews.push({ url, title })
      return
    }
    return this.visitors.sendPageView(url, title)
  }

  ///

  private async connectSocket(): Promise<void> {
    return new Promise(resolve => {
      this.socket.onOpen(resolve)
      this.socket.connect()
    })
  }

  private async getBotConfig(): Promise<BotAPIResponse> {
    const { secure, hostname, botId } = this.config
    const url = `http${secure ? 's' : ''}://${hostname}/api/bot/${botId}`
    const result = await fetch(url)
    return await result.json()
  }
}
