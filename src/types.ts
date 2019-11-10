// SDK external facting types

/** Contains the necessary parameters to instantiate a [[ChatBubble]] class */
export interface Config {
  /** The identifier of the bot. The bot ID can be found in the URL when viewing the bot in the Botsquad studio. */
  botId: string

  /** The user agent string that identifies this client. The user agent needs to be structured like this: `appname/version (OS os_version)`; for instance: `MyApp/1.0.0 (iOS 13.1.2) */
  userAgent: string

  /** A valid ISO language code; for instance `en`, or `nl_BE`. */
  locale?: string

  /** The user's timezone, needs to be a valid timezone like `Europe/Amsterdam`. */
  timezone?: string

  /**
   * The token that identifiers this user. The first time a connection is made, the token can be
   * omitted, as it will be returned in the result of [[ChatBubble.connect]]. Each subsequent
   * `connect()` call should have this same userToken parameter, to ensure that the user is
   * correctly identified.
   */
  userToken?: string

  /** The hostname of the endpoint. By default this points at `bsdq.me`. Leave unchanged in most cases. */
  hostname?: string

  /** Whether the connecting endpoint uses HTTPS or not. Defaults to `true`. Leave unchanged in most cases. */
  secure?: boolean
}

export interface ConnectResult {
  /**
   * The user's token as returned from the server. Save this token locally and use it the next time
   * in the [[ChatBubble]] constructor to ensure that the user is being identified over subsequent
   * sessions.
   */
  userToken: string

  /** The current badge count that should be displayed on the chat bubble. */
  badgeCount: number

  /** The bot details. These can be used to create the chat bubble. */
  bot: {
    id: string
    title: string
    profilePicture: string
  }

  /** The current user's context. */
  context: Record<string, any>
}

/** Information about a "nudge"; a small piece of information that is shown to get the user to engage with the chatbot. */
export interface Nudge {
  /** Identifier */
  id: string
  /** The nudge message */
  message: string
  /** A caption which can be displayed on top of the nudge widget */
  caption?: string
  /** A profile picture */
  profile_picture?: string
}

/** Enumeration of the supported push notification providers */
export enum PushService {
  WEB_PUSH = 'web-push',
  FIREBASE = 'firebase',
  PUSHWOOSH = 'pushwoosh',
  EXPO = 'expo'
}

// Botsquad websocket / REST API responses
export namespace Internal {

  export interface BotAPIResponse {
    id: string
    title: string
    profile_picture: string
    locale: string
    extra_locales: string[]
    web_pwa: {
      id: string
      is_subdomain: boolean
    }
  }

  export interface ConversationsJoinResponse {
    userToken: string
    userId: string
    badgeCount: number
    context: Record<string, any>
  }

  export interface ConversationsChannelJoinResponse {
    delegate_token: string
    user_id: string
  }

  export interface Conversation {
    g: string
    inserted_at: string
    conversation_data: Record<string, any>
    last_message: string
    last_message_date: string
    read_until: string
    unread_message_count: number
  }

  export interface ConversationsListResponse {
    conversations: Conversation[]
  }

  export interface VisitorsJoinResponse {
    visitor_id: string
    user_id: string
  }

  export interface VisitorsJoinParams {
    visitor_id: string
    user_agent?: string
    timezone?: string
    locale?: string
  }

  export interface PageView {
    url: string
    title: string
  }

  export interface VisitorsNudge {
    id: string
    json: string
  }

  export enum NudgeResponse {
    ENGAGE = 'engage',
    DISCARD = 'discard'
  }

  export interface PushRegisterAPIRequest {
    type: PushService
    data: any
    delegate_token: string
  }

  export interface PushRegisterAPIResponse {
    status: "OK"
  }
}
