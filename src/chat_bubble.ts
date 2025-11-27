import { LongPoll, Socket } from 'phoenix'
import { SimpleEventDispatcher } from 'ste-simple-events'

import {
  Config,
  ConnectResult,
  Nudge,
  ExtendedNudgeResponse,
  Event,
  PushService,
  UserInfo,
  API,
} from './types'
import { REST as R } from './rest_client'
import { Conversations as C } from './conversations'
import { Visitors as V } from './visitors'

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
 *  - Receive events that are sent from the bot
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
 *   userInfo,
 *   badgeCount,
 *   bot: {
 *     id, title, profilePicture
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
 *
 * // configure push token
 * await bubble.configurePushToken('pushwoosh', '<token data>')
 *
 * // send extra user information to the bot
 * await bubble.putUserInfo({ first_name: "john", last_name: "doe", visitor_id: "12345" })
 * ```
 */
export class ChatBubble {
  private config: Config
  private socket: Socket
  private conversations: C.Manager
  private visitors: V.Manager | null = null
  private onNudgeDispatcher = new SimpleEventDispatcher<Nudge>()
  private onEventDispatcher = new SimpleEventDispatcher<Event>()

  public botResponse?: API.BotResponse
  public restClient: R.Client

  private userId?: string
  private userToken?: string
  private userInfo: UserInfo | null = null
  private postConnect: (() => void)[] = []

  /**
   * Create the ChatBubble instance
   */
  constructor(config: Config) {
    if (!config.userAgent.length) {
      throw new Error('Required parameter missing: userAgent')
    }
    if (!config.botId.length) {
      throw new Error('Required parameter missing: botId')
    }
    config.locale = (config.locale || window?.navigator?.language || 'en').replace('-', '_')
    config.timezone =
      config.timezone ||
      window?.Intl?.DateTimeFormat().resolvedOptions().timeZone ||
      'Europe/Amsterdam'
    config.hostname = config.hostname || 'bsqd.me'
    config.secure = typeof config.secure === 'undefined' ? true : !!config.secure

    this.socket = buildSocket(config)
    this.restClient = new R.Client(config)
    this.conversations = new C.Manager(this.socket, config, this.onEventDispatcher)
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
    const botResult = this.restClient.getBotConfig(this.config.botId, this.config.isPreview)
    const [bot] = await Promise.all([botResult, this.connectSocket()])

    this.botResponse = bot

    // join conversations channel, for badge count, context and delegate token
    const joinResponse = await this.conversations.join()
    const { userToken, userId, userInfo } = joinResponse
    this.userId = userId
    this.userToken = userToken
    this.userInfo = userInfo

    // join visitors channel for nudges.
    this.visitors = new V.Manager(
      this.socket,
      this.config,
      joinResponse,
      this.onNudgeDispatcher,
      this.onEventDispatcher,
    )

    try {
      await this.visitors.join()
    } catch (e) {
      this.visitors = null
    }

    // send any pending request
    try {
      await Promise.all(this.postConnect.map((callback) => callback()))
    } catch (e) {
      // console.log('Error in postconnect callback', e);
    }
    this.postConnect = []

    return {
      userToken,
      userId,
      userInfo: this.userInfo,
      bot: {
        id: bot.id,
        title: bot.title,
        profilePicture: bot.profile_picture,
      },
    }
  }

  /**
   * Close the connection to the server, if it was opened.
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket.isConnected()) {
        resolve()
      } else {
        this.socket.disconnect(resolve)
      }
    })
  }

  /**
   * Send a page view event to the server.
   *
   * Use this to track on which page of the website your user is currently visiting. In the backend
   * this is used to show a realtime view of current visitors.
   *
   * @param url   The URL of the current page. This parameter needs to be a valid URL, in the form of `scheme://hostname/path`. For native apps, use something like `app://app-package-name/current-screen`. If your native app supports [Android app links](https://developer.android.com/training/app-links/) or [iOS Universal links](https://developer.apple.com/ios/universal-links/), you can also send these.
   * @param title The title of the current page or app screen.
   */
  async sendPageView(url: string, title: string) {
    return this.whenConnected<{}>(() => this.visitors?.sendPageView(url, title) || Promise.reject())
  }

  /**
   * Send a page scroll percentage to the server
   *
   * Nudges can be triggered when the page has scrolled to a certain percentage.
   */
  async sendPageScroll(percentage: number) {
    return this.whenConnected<{}>(
      () => this.visitors?.sendPageScroll(percentage) || Promise.reject(),
    )
  }

  /**
   * Report the opened state of the chat back to the chat bubble
   *
   * While the chat is opened, nudges will be suspended from triggering.
   */
  async sendChatOpenState(open: boolean) {
    return this.whenConnected<{}>(() => this.visitors?.sendChatOpenState(open) || Promise.reject())
  }

  /**
   * Subscribe to changes in any of the conversations in the chat bubble.
   *
   * Usage:
   * ```
   * bubble.onConversationsUpdate.subscribe(info => console.log(`Badge count updated: ${info.badgeCount}`))
   * ```
   *
   * When you subscribe to the conversations update, the callback is invoked right away with the
   * current badge count value.
   */
  get onConversationsUpdate() {
    return this.conversations.getOnConversationsUpdate()
  }

  /**
   * Subscribe to nudges that are sent from the server. Nudges are sent in response to visitor
   * events, mainly page views.
   */
  get onNudge() {
    return this.onNudgeDispatcher.asEvent()
  }

  /**
   * Subscribe to any events that are sent from the server. From within a bot, an event can be
   * emitted to the chat bubble, by doing `emit "name", to: :chat_bubble` in BubbleScript.
   */
  get onEvent() {
    return this.onEventDispatcher.asEvent()
  }

  /**
   * Signal the server that the user has seen the nudge.
   */
  nudgeShown(nudge: Nudge): Promise<void> {
    return this.visitors?.nudgeResponse(nudge, API.NudgeResponse.SHOW) || Promise.reject()
  }

  /**
   * Signal the server that the user has engaged with a nudge.
   */
  nudgeEngage(nudge: Nudge, response?: ExtendedNudgeResponse): Promise<void> {
    return (
      this.visitors?.nudgeResponse(nudge, API.NudgeResponse.ENGAGE, response) || Promise.reject()
    )
  }

  /**
   * Signal the server that the user has discarded a nudge. The given nudge will not be triggered
   * again for this user.
   */
  nudgeDiscard(nudge: Nudge): Promise<void> {
    return this.visitors?.nudgeResponse(nudge, API.NudgeResponse.DISCARD) || Promise.reject()
  }

  /**
   * Retrieve the URL for the webview that can be embedded to show the bot's conversation(s).
   * Returns `null` when not connected or when the configured but does not have a publicly
   * accessible web interface.
   */
  getWebviewUrl(g?: string): string | null {
    if (!this.botResponse?.pwa?.id) return null
    let url = `http${this.config.secure ? 's' : ''}://`

    const { id, is_subdomain } = this.botResponse.pwa
    const { hostname } = this.config
    if (is_subdomain) {
      url += `${id}.${hostname}`
    } else {
      url += id
    }
    url += `/embed`
    if (this.userToken) {
      url += `?u=${this.userToken || ''}`
    }
    url += `#/g/${g || 'main'}`
    return url
  }

  /**
   * Register a push token for the current connection.
   *
   * Valid push types are `web-push`, `firebase`, `pushwoosh` and `expo`.
   */
  registerPushToken(type: PushService, data: any) {
    return this.whenConnected<API.OkResponse>(() =>
      this.restClient.pushSubscribe(this.config.botId, this.userToken!, type, data),
    )
  }

  /**
   * Push a user information update to the Botsquad platform.
   *
   * For any subsequent new chatbot conversation, the information provided in this API call will be
   * available in Bubblescript under the `user.*` variable namespace.
   */
  putUserInfo(info: UserInfo) {
    return this.whenConnected<UserInfo>(async () => {
      this.userInfo = await this.conversations.putUserInfo(info)
      return this.userInfo
    })
  }

  /**
   * Return the locally known information about the user.
   */
  getUserInfo() {
    return this.userInfo
  }

  /**
   * Return the current user ID of this connection
   */
  getUserId() {
    return this.userId
  }

  /**
   * Close the named conversation
   */
  closeConversation(g: string) {
    return this.whenConnected<void>(async () => this.conversations.closeConversation(g))
  }

  /**
   * Return the socket
   */
  getSocket() {
    return this.socket
  }

  ///

  private whenConnected<T>(callback: () => Promise<T>): Promise<T> {
    if (this.userToken) {
      return callback()
    } else {
      return new Promise((resolve) => {
        this.postConnect.push(async () => resolve(await callback()))
      })
    }
  }

  private async connectSocket(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.onOpen(resolve)
      this.socket.connect()
    })
  }
}

export function buildSocket(config: Config): Socket {
  const reconnectAfterMs = (tries: number) => [100, 500, 500, 500, 500, 750, 750][tries - 1] || 1000

  const opts = {
    params: { frontend: config.frontend || 'web_widget' },
    heartbeatIntervalMs: 5000,
    reconnectAfterMs,
  }

  const socket = new Socket(`ws${config.secure ? 's' : ''}://${config.hostname}/socket`, opts)
  const sock = socket as any

  socket.onOpen(() => {
    sock._connectionEstablishedOnce = true
  })

  socket.onError((_reason, transport, establishedConnections) => {
    sock.channels.forEach((ch: any) => {
      const params = ch.params()
      ch.params = () => ({ ...params, reconnect: true })
      ch.joinPush.payload = ch.params
    })

    if (transport !== LongPoll && establishedConnections === 0) {
      socket.replaceTransport(LongPoll)
      socket.connect()
    }
  })

  socket.connect()
  return socket
}
