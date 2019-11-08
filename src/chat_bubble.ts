import { Socket, Channel, Presence } from 'phoenix'
import 'whatwg-fetch'

import {
  Config,
  ConnectResult,
  BotAPIResponse,
 } from './types'
import { Conversations } from './conversations'

export class ChatBubble {
  private config: Config
  private socket: Socket
  private conversations: Conversations

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

    this.socket = new Socket(`ws${config.secure ? 's' : ''}://${config.hostname}/socket`)
    this.conversations = new Conversations(this.socket, config)
    this.config = config
  }

  getConfig() {
    return this.config
  }

  async connect(): Promise<ConnectResult> {
    // retrieve bot config
    const bot = await this.getBotConfig()

    // connect the socket
    await this.connectSocket()

    // join visitors channel (for live view)

    // join conversations channel (for badge count, context and delegate token)
    const { userToken, badgeCount, context } = await this.conversations.join()

    // if we have context in the config, push it over the conversations channel now.

    const result: ConnectResult = {
      userToken,
      badgeCount,
      context,
      bot: {
        id: bot.id,
        title: bot.title,
        profilePicture: bot.profile_picture
      }
    }
    return result
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

  ///

  private async connectSocket() {
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
