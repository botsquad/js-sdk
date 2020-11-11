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
   * An application-specific user identifier. Mutually exclusive with `userToken`; if `userId` is
   * set, `userToken` will be ignored.
   */
  userId?: string

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

  /**
   * The user's ID.
   */
  userId: string

  /** The current badge count that should be displayed on the chat bubble. */
  badgeCount: number

  /** The currently known information about the user. Will be `undefined` when the user is not yet known in the system. */
  userInfo: UserInfo | null

  /** The bot details. These can be used to create the chat bubble. */
  bot: {
    id: string
    title: string
    profilePicture: string
  }
}

/**
 * Contains the information that is known about the user.
 *
 * Any key / value properties can be set in the information, using [[ChatBubble.putUserInfo]]. The
 * properties listed here are special, in the sense that they are used by the platform. Some
 * properties (tags, frontend) cannot be updated through the `putUserInfo` call.
 */
export interface UserInfo extends Record<string, any> {
  /** A list of tags set on the user */
  tags?: string[]
  /** The primary channel that the user users to chat with the bot */
  frontend?: string
  /** The users's first name */
  first_name?: string
  /** The users's last name */
  last_name?: string
  /** URL of the profile picture */
  profile_picture?: string
  /** The users's timezone */
  timezone?: string
  /**
   * The user's locale. Note that this locale can be different than the one that is passed in to
   * [[ChatBubble]]; the bot might have decided to switch locale.
   */
  locale?: string
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
  /** The conversation identifier */
  g?: string
  /** The bot event that should be sent to the conversation */
  bot_event: Event
  /** Show a textual input with this nudge */
  text_input?: {
    enabled: boolean
    placeholder: string
  }
}

export interface ExtendedNudgeResponse {
  text_input?: string
}

/** An event that is being received by the chat bubble. */
export interface Event {
  /** The name of the event */
  name: string
  /** The sender of the event */
  sender?: string
  /** The event's payload */
  payload?: any
}

/** Enumeration of the supported push notification providers */
export enum PushService {
  WEB_PUSH = 'web-push',
  FIREBASE = 'firebase',
  PUSHWOOSH = 'pushwoosh',
  EXPO = 'expo'
}

// Botsquad websocket / REST API responses
export namespace API {
  export type ChatInputPart = 'text' | 'location' | 'image' | 'file' | 'audio'

  export interface ChatConfig {
    disabled_inputs: ChatInputPart[]
  }

  export interface BotResponseWidget {
    visitors: boolean
    visitors_sdk_only: boolean
    domains: string[]
    main_color: string
    icon_url: string
    layout: 'normal' | 'large' | 'fullscreen'
  }

  export interface BotResponsePWA {
    appearance: 'app' | 'basic'
    ua_tracking_id?: string
    vary?: string
    manifest: {
      theme_color: string
      background_color?: string
      display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
      orientation?: string
    }
    intro_screen?: BotPWAScreen
    start_screen?: {
      home_buttons?: BotPWAScreen[]
      image_url?: string
      title?: string
      description?: string
      new_conversation_button?: boolean
    }
    splash_screen?: {
      title?: string
      description?: string
      call_to_action?: string
      footer?: string
    }
    chat_config?: ChatConfig
    embed_chat_config?: ChatConfig
    extra_js?: string
    extra_css?: string
  }

  export interface BotPWAScreen {
    type: 'conversation' | 'web_url'
    chat_config?: ChatConfig
    title: string
    url?: string
    icon?: string
    image_url?: string
    link_target?: string
    g?: string
    event?: Event
    hide_input?: boolean
  }

  export interface BotResponse {
    id: string
    title: string
    purpose: string
    profile_picture: string
    locale: string
    extra_locales: string[]
    ui_labels: any
    web_pwa: {
      id: string
      is_subdomain: boolean
    }
    pwa: BotResponsePWA
    web_widget: BotResponseWidget
    widget: {
      extra_css?: string
      extra_js?: string
      powered_by?: boolean | { text: string; url: string }
      chat_config?: ChatConfig
      home?: {
        image_url?: string
        title?: string
        description?: string
        conversation_cta?: string
        team_message?: string
      }
    }
  }

  export interface ConversationsJoinResponse {
    userToken: string
    userId: string
    badgeCount: number
    userInfo: UserInfo | null
  }

  export interface ConversationsChannelJoinResponse {
    delegate_token: string
    user_id: string
    user: UserInfo | null
  }

  export interface Conversation {
    g: string
    inserted_at: string
    conversation_data: Record<string, any>
    last_message: string
    last_message_date: string
    read_until: string
    unread_message_count: number
    operator?: Operator
  }

  export interface ConversationsListResponse {
    conversations: Conversation[]
  }

  export interface Operator {
    id: string
    name?: string
    first_name?: string
    last_name?: string
    profile_picture?: string
    status: 'online' | 'away' | 'offline'
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

  export interface ChannelEvent {
    name: string
    sender: string
    json: string
  }

  export enum NudgeResponse {
    SHOW = 'show',
    ENGAGE = 'engage',
    DISCARD = 'discard'
  }

  export interface PushRegisterRequest {
    type: PushService
    data: any
    delegate_token: string
  }

  export interface PushRegisterResponse {
    result: 'OK'
  }
}
