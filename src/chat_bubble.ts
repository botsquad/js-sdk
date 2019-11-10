import { Socket } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'

import {
  Config,
  ConnectResult,
  Nudge,
  PushService,
  Internal as I,
} from './types'
import { Internal as R } from './rest_client'
import { Internal as C } from './conversations'
import { Internal as V } from './visitors'

/**
 * # ChatBubble
 *
 * The ChatBubble class is the high-level container class that allows you to render a Chat Bubble in
 * your web page or React Native app.
 *
 * Main entry point for interfacing with all functions related to the Botsquad chat bubble.  Its main
 * purposes are the following:
 *
 *  - Get information about the chat bubble (bot details, unread message count)
 *  - Keep the unread message count updated in realtime
 *  - Send 'page view' events to indicate on which page the bubble is being displayed
 *  - Configure the (web)app's push token
 *  - Handle in-app nudges and allow the user to engage with these.
 *
 * ## Getting started
 *
 * Instantiate this class with a [[Config]] object; then call [[ChatBubble.connect]] to establish the
 * connection to the server.
 *
 * Example code:
 *
 * ```javascript
 * import { ChatBubble } from '@botsquad/sdk'
 *
 * const config = {
 *   // required:
 *   botId: '66a8fe768ea6fea876f987ea',
 *   userAgent: 'testApp/1.0 (Android; 8)',
 *
 *   // optional:
 *   locale: 'nl_NL',
 *   timezone: 'Europe/Amsterdam',
 *   userToken: '<userToken that was sent on the previous connect()>',
 *   hostname: 'bsqd.me'
 * }
 *
 * const bubble = new ChatBubble(config)
 *
 * // initiate the connection.
 * const info = await bubble.connect()
 *
 * // information that is returned:
 * const {
 *   userToken,
 *   badgeCount,
 *   bot: {
 *     id, title, profilePicture
 *   },
 *   context: {
 *     any: 'value'
 *   }
 * } = info
 *
 * console.log(`Connected with user token: ${userToken}`)
 *
 * bubble.on('badgeCountUpdate', badgeCount => {
 *   console.log('Got new badge count: ' + badgeCount)
 * })
 *
 * // page change
 * bubble.sendPageView('http://pageurl.com', 'page title')
 *
 * // nudges
 * bubble.on('nudge', nudge => {
 *   const {
 *     message, profilePicture, caption
 *   } = nudge
 *
 *   // show the nudge
 *   if (caption) {
 *     // show nudge with title bar and (optionally) a picture
 *   } else {
 *     // show basic message-only nudge
 *   }
 * })
 *
 * // dismiss the nudge
 * bubble.nudgeDismiss(nudge)
 *
 * // engage with the nudge
 * await bubble.nudgeEngage(nudge)
 *
 * // open the chat by visiting the webview URL:
 * bubble.getWebviewUrl()
 * ```
 *
 * Still to implement:
 *
 * ```
 * // configure push token
 * bubble.configurePushToken('pushwoosh', '<token data>')
 *
 * // get the URL for the chat when clicking on a nudge
 * bubble.getWebviewUrl(nudge)
 * ```
 */
export class ChatBubble {
  private config: Config
  private socket: Socket
  private conversations: C.Conversations
  private visitors?: V.Visitors
  private onNudgeDispatcher = new SimpleEventDispatcher<Nudge>()

  private bot?: I.BotAPIResponse
  private userToken?: string
  private restClient: R.RESTClient
  private postConnect: (() => void)[] = []

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
    this.restClient = new R.RESTClient(config)
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
    const botResult = this.restClient.getBotConfig(this.config.botId)
    const [bot,] = await Promise.all<I.BotAPIResponse, void>([botResult, this.connectSocket()])

    this.bot = bot

    // join conversations channel (for badge count, context and delegate token)
    const joinResponse = await this.conversations.join()
    const { userToken, badgeCount, context } = joinResponse
    this.userToken = userToken

    this.visitors = new V.Visitors(this.socket, this.config, joinResponse, this.onNudgeDispatcher)
    await this.visitors.join()

    // send any pending pageview
    this.postConnect.forEach(callback => callback())
    this.postConnect = []

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
    this.whenConnected(() => {
      this.visitors!.sendPageView(url, title)
    })
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
      url += `?u=${this.userToken || ''}`
    }
    return url
  }

  /**
   * Register a push token for the current connection.
   *
   * Valid push types are `web-push`, `firebase`, `pushwoosh` and `expo`.
   */
  public registerPushToken(type: PushService, data: any): void {
    this.whenConnected(() => {
      this.restClient.pushSubscribe(this.config.botId, this.userToken!, type, data)
    })
  }

  ///

  private whenConnected(callback: () => void) {
    if (this.userToken) {
      callback()
    } else {
      this.postConnect.push(callback)
    }
  }

  private async connectSocket(): Promise<void> {
    return new Promise(resolve => {
      this.socket.onOpen(resolve)
      this.socket.connect()
    })
  }
}
