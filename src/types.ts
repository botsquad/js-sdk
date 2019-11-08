// SDK external facting types

export interface Config {
  botId: string
  userAgent: string

  locale?: string
  timezone?: string
  userToken?: string
  hostname?: string
  secure?: boolean
  context?: Record<string, any>
}

export interface ConnectResult {
  userToken: string
  badgeCount: number
  bot: {
    id: string
    title: string
    profilePicture: string
  }
  context: Record<string, any>
}

// Botsquad websocket / REST API responses

export interface BotAPIResponse {
  id: string
  title: string
  profile_picture: string
  locale: string
  extra_locales: string[]
}

export interface ConversationsJoinResponse {
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
