import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// 加载 YAML 数据
function loadFriendsDataFromYAML() {
  const friendsDataDir = path.join(process.cwd(), 'src/data/friends')

  try {
    // 读取 friends.yaml
    const friendsPath = path.join(friendsDataDir, 'friends.yaml')
    let friends = []

    if (fs.existsSync(friendsPath)) {
      const friendsContent = fs.readFileSync(friendsPath, 'utf-8')
      friends = yaml.load(friendsContent) || []
    }

    // 读取 rejected.yaml
    const rejectedPath = path.join(friendsDataDir, 'rejected.yaml')
    let rejected = []

    if (fs.existsSync(rejectedPath)) {
      const rejectedContent = fs.readFileSync(rejectedPath, 'utf-8')
      rejected = yaml.load(rejectedContent) || []
    }

    return {
      approved: friends.filter(friend => friend.status === 'active'),
      pending: [], // 不再使用 pending.yaml
      rejected
    }
  } catch (error) {
    console.error('Error loading friends data:', error)
    return {
      approved: [],
      pending: [],
      rejected: []
    }
  }
}

// 生成 TypeScript 数据文件
function generateFriendsDataFile() {
  const data = loadFriendsDataFromYAML()

  const tsContent = `// 此文件由构建脚本自动生成，请勿手动编辑
import type { Friend, FriendApplication, FriendsData } from '@/types/friend'

export const friendsData: FriendsData = ${JSON.stringify(data, null, 2)}
`

  const outputPath = path.join(process.cwd(), 'src/lib/friends-data.ts')
  fs.writeFileSync(outputPath, tsContent, 'utf-8')
  console.log('✅ Friends data file generated successfully')
}

console.log('🔄 Building friends data from YAML files...')
generateFriendsDataFile()
console.log('✅ Friends data build completed')