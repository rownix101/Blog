import type { Friend, FriendApplication } from '@/types/friend'
import { friendsData } from './friends-data'

export function getApprovedFriends(): Friend[] {
  return friendsData.approved
    .filter(friend => friend.status === 'active')
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
}

export function getFriendsByCategory(category?: string): Friend[] {
  const friends = getApprovedFriends()
  if (!category) return friends
  return friends.filter(friend => friend.category === category)
}

export function getFriendCategories(): string[] {
  const friends = getApprovedFriends()
  const categories = friends
    .map(friend => friend.category)
    .filter(Boolean) as string[]
  return [...new Set(categories)].sort()
}

export function generateFriendId(name: string, url: string): string {
  const timestamp = Date.now()
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const urlSlug = new URL(url).hostname.replace(/[^a-z0-9]/g, '-')
  return `${nameSlug}-${urlSlug}-${timestamp}`
}

export function validateFriendApplication(data: {
  name: string
  url: string
  description: string
  contact: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push('站点名称至少需要2个字符')
  }

  if (!data.url || !isValidUrl(data.url)) {
    errors.push('请输入有效的网站地址')
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('站点描述至少需要10个字符')
  }

  if (!data.contact || !isValidEmail(data.contact)) {
    errors.push('请输入有效的联系邮箱')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}