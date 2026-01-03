export interface Friend {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  category?: string
  contact: string
  addedAt: string
  status: 'active' | 'inactive'
  rel?: 'friend' | 'sponsor' | 'colleague'
}

export interface FriendApplication {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  category?: string
  contact: string
  submittedAt: string
  status: 'pending'
  applicantGithub?: string
}

export interface FriendsData {
  pending: FriendApplication[]
  approved: Friend[]
  rejected: Array<{
    id: string
    name: string
    url: string
    description: string
    contact: string
    rejectedAt: string
    reason?: string
  }>
}