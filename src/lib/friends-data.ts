import type { Friend, FriendApplication, FriendsData } from '@/types/friend'
import yaml from 'js-yaml'

// This file will be processed at build time
export const friendsData: FriendsData = {
  approved: [
    {
      id: 'acofork-blog-blog-acofork-com-1767433920218',
      name: 'Acofork Blog',
      url: 'https://blog.acofork.com/',
      description: '树树的博客，基于Astro搭建',
      avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=0',
      category: '技术',
      contact: 'acokfork@foxmail.com',
      addedAt: '2026-01-03T09:52:00.218Z',
      status: 'active',
      rel: 'friend'
    }
  ],
  pending: [],
  rejected: []
}