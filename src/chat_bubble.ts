import { Socket } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'

import {
  Config,
  ConnectResult,
  Nudge,
  Internal as I,
} from './types'

import { Internal as C } from './conversations'
import { Internal as V } from './visitors'

/**
 * Main entry point for interfacing with all functions related to the Botsquad chat bubble.
 */
export class ChatBubble {
  private config: Config
  private socket: Socket
  private conversations: C.Conversations
  private visitors?: V.Visitors
  private pendingPageViews: I.PageView[] = []
  private onNudgeDispatcher = new SimpleEventDispatcher<Nudge>()

  private bot?: I.BotAPIResponse
  private userToken?: string

  /**
   * Create the ChatBubble instance
   */
  constructor(config: Config) {
    if (!config.userAgent.length) {
      throw(new Error('Required parameter missing: userAgent'))
    }
    if (!config.botId.length) {
      throw(new Error('Required parameter missing: botId'))
    }
    config.locale = (config.locale || window?.navigator?.language || 'en').replace('-', '_')
    config.timezone = config.timezone || window?.Intl?.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam'
    config.hostname = config.hostname || 'bsqd.me'
    config.secure = typeof config.secure === 'undefined' ? true : !!config.secure

    this.socket = new Socket(`ws${config.secure ? 's' : ''}://${config.hostname}/socket`)
    this.conversations = new C.Conversations(this.socket, config)
    this.config = config
  }

  /**
   * Return the current config. This is the Config object that was passed in, augmented with all the default parameters.
   */
  getConfig() {
    return this.config
  }

  /**
   * Open the websocket connection to the server.
   */
  async connect(): Promise<ConnectResult> {
    // retrieve bot config, connect
    const [bot,] = await Promise.all<I.BotAPIResponse, void>([this.getBotConfig(), this.connectSocket()])

    this.bot = bot

    // join conversations channel (for badge count, context and delegate token)
    const joinResponse = await this.conversations.join()
    const { userToken, badgeCount, context } = joinResponse
    this.userToken = userToken

    this.visitors = new V.Visitors(this.socket, this.config, joinResponse, this.onNudgeDispatcher)
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

  /**
   * Close the connection to the server, if it was opened.
   */
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

  /**
   * Send a page view event to the server. Use this to track on which page of the website your user
   * is currently visiting. In the backend this is used to show a realtime view of current visitors.
   */
  async sendPageView(url: string, title: string) {
    if (!this.visitors) {
      this.pendingPageViews.push({ url, title })
      return
    }
    return this.visitors.sendPageView(url, title)
  }

  /**
   * Subscribe to updates to the badge counter in the chat bubble.
   */
  get onBadgeCountUpdate() {
    return this.conversations.onBadgeCountUpdate.asEvent()
  }

  /**
   * Subscribe to nudges that are sent from the server. Nudges are sent in response to visitor
   * events, mainly page views.
   */
  get onNudge() {
    return this.onNudgeDispatcher.asEvent()
  }

  /**
   * Signal the server that the user has engaged with a nudge.
   */
  nudgeEngage(nudge: Nudge): Promise<void> {
    return this.visitors?.nudgeResponse(nudge, I.NudgeResponse.ENGAGE) || Promise.reject()
  }

  /**
   * Signal the server that the user has discarded a nudge. The given nudge will not be triggered
   * again for this user.
   */
  nudgeDiscard(nudge: Nudge): Promise<void> {
    return this.visitors?.nudgeResponse(nudge, I.NudgeResponse.DISCARD) || Promise.reject()
  }

  /**
   * Retrieve the URL for the webview that can be embedded to show the bot's conversation(s).
   * Returns `null` when not connected or when the configured but does not have a publicly
   * accessible web interface.
   */
  getWebviewUrl(): string | null {
    if (!this.bot?.web_pwa?.id) return null
    let url = `http${this.config.secure ? 's' : ''}://`

    const { id, is_subdomain } = this.bot.web_pwa
    const { hostname } = this.config
    if ( is_subdomain) {
      url += `${id}.${hostname}`
    } else {
      url += id
    }
    url += `/embed`
    if (this.userToken) {
      url += `?u=${this.config.userToken}`
    }
    return url
  }

  ///

  private async connectSocket(): Promise<void> {
    return new Promise(resolve => {
      this.socket.onOpen(resolve)
      this.socket.connect()
    })
  }

  private async getBotConfig(): Promise<I.BotAPIResponse> {
    const { secure, hostname, botId } = this.config
    const url = `http${secure ? 's' : ''}://${hostname}/api/bot/${botId}`
    const result = await fetch(url)
    return result.json()
  }
}
