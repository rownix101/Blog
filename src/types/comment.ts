export interface User {
  id: string
  email: string
  username: string
  password_hash?: string | null
  avatar_url: string | null
  created_at: number
  updated_at: number
  email_verified: number
  two_factor_enabled: number
  two_factor_secret: string | null
}

export interface OAuthAccount {
  id: string
  user_id: string
  provider: string
  provider_user_id: string
  provider_email: string | null
  provider_username: string | null
  provider_avatar_url: string | null
  access_token: string | null
  refresh_token: string | null
  expires_at: number | null
  created_at: number
  updated_at: number
}

export interface Session {
  id: string
  user_id: string
  token: string
  user_agent: string | null
  ip_address: string | null
  expires_at: number
  created_at: number
}

export interface TwoFactorToken {
  id: string
  user_id: string
  token: string
  type: 'email' | 'recovery'
  expires_at: number
  used: number
  created_at: number
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  created_at: number
  updated_at: number
}

export interface CommentWithUser extends Comment {
  user: User
  replies?: CommentWithUser[]
}

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam'
export type OAuthProvider = 'google'
export type TwoFactorType = 'email' | 'recovery'
