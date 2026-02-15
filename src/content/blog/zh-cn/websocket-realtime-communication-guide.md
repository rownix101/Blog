---
title: 'WebSocket 实时通信实战：从聊天室到在线协作'
description: '深入理解 WebSocket 协议，构建高性能实时应用，掌握 Socket.io 和原生 WebSocket 最佳实践'
date: '2026-02-16'
tags: ['WebSocket', '实时通信', 'Socket.io', 'Node.js', '多人在线']
authors: ['rownix']
draft: false
---

> **TL;DR**: 深入理解 WebSocket 协议原理，掌握 Socket.io 框架，构建聊天室、在线协作等实时应用。

## 为什么需要 WebSocket？

### 传统方案的局限

```
HTTP 轮询 (Polling):
客户端                    服务端
   |                        |
   |--- GET /updates -----> |
   |<-- 无新数据 ---------- |
   |                        |  (等待 5 秒)
   |--- GET /updates -----> |
   |<-- 无新数据 ---------- |
   |                        |  (等待 5 秒)
   |--- GET /updates -----> |
   |<-- 有新数据! --------- |

问题：大量无效请求，延迟高，服务器压力大

长轮询 (Long Polling):
客户端                    服务端
   |--- GET /updates -----> |
   |                        |  (保持连接等待)
   |                        |  (保持连接等待)
   |<-- 有新数据! --------- |
   |--- GET /updates -----> |
   |                        |  (保持连接等待)

问题：每次响应后需要重新建立连接，依然低效
```

### WebSocket 优势

```
WebSocket 连接:
客户端                    服务端
   |--- HTTP Upgrade -----> |  (1次握手)
   |<-- 101 Switching ---- |
   |                        |
   ====== 全双工连接建立 ======
   |                        |
   |<-- 服务端推送数据 ----- |  (任意时刻)
   |--- 客户端发送数据 ---> |  (任意时刻)
   |<-- 服务端推送数据 ----- |
   |                        |
   
优势：
- 持久连接，一次握手
- 全双工通信，双方随时发送
- 头部开销小 (2-14字节)
- 低延迟 (< 10ms)
```

## WebSocket 协议详解

### 握手过程

```http
// 客户端请求 (标准 HTTP 请求)
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com

// 服务端响应 (101 状态码)
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

```javascript
// Sec-WebSocket-Accept 计算
const crypto = require('crypto')

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const key = 'dGhlIHNhbXBsZSBub25jZQ=='

const accept = crypto
  .createHash('sha1')
  .update(key + GUID)
  .digest('base64')

console.log(accept)  // s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### 数据帧结构

```
WebSocket 数据帧格式:
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               | Masking-key, if MASK set to 1 |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+

FIN: 1位，是否为最后一帧
RSV1-3: 3位，保留位
Opcode: 4位，操作码 (0x1=text, 0x2=binary, 0x8=close, 0x9=ping, 0xA=pong)
MASK: 1位，是否掩码 (客户端必须设为1)
Payload length: 7位，数据长度 (0-125直接表示，126=16位扩展，127=64位扩展)
Masking-key: 32位，掩码密钥 (仅客户端发送时存在)
```

## 原生 WebSocket 实战

### 服务端实现 (Node.js)

```javascript
// server.js - 原生 WebSocket 服务
const http = require('http')
const WebSocket = require('ws')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket Server Running\n')
})

const wss = new WebSocket.Server({ server })

// 存储连接
const clients = new Map()

wss.on('connection', (ws, req) => {
  const clientId = generateClientId()
  const clientInfo = {
    id: clientId,
    ws,
    connectedAt: new Date(),
    room: null
  }
  
  clients.set(clientId, clientInfo)
  
  console.log(`Client ${clientId} connected. Total: ${clients.size}`)
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Connected to server',
    clientId
  }))
  
  // 消息处理
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      handleMessage(clientId, message)
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  })
  
  // 断开连接
  ws.on('close', (code, reason) => {
    const client = clients.get(clientId)
    if (client?.room) {
      leaveRoom(clientId, client.room)
    }
    clients.delete(clientId)
    console.log(`Client ${clientId} disconnected. Code: ${code}`)
  })
  
  // 错误处理
  ws.on('error', (error) => {
    console.error(`Client ${clientId} error:`, error)
  })
})

// 消息处理器
function handleMessage(clientId, message) {
  const client = clients.get(clientId)
  if (!client) return
  
  switch (message.type) {
    case 'join':
      joinRoom(clientId, message.room)
      break
    case 'leave':
      leaveRoom(clientId, client.room)
      break
    case 'broadcast':
      broadcast(message.data, client.room)
      break
    case 'dm':
      sendDirectMessage(clientId, message.to, message.data)
      break
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', time: Date.now() }))
      break
    default:
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }))
  }
}

// 房间管理
const rooms = new Map()

function joinRoom(clientId, roomName) {
  const client = clients.get(clientId)
  if (!client || !roomName) return
  
  // 离开旧房间
  if (client.room) {
    leaveRoom(clientId, client.room)
  }
  
  // 加入新房间
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set())
  }
  rooms.get(roomName).add(clientId)
  client.room = roomName
  
  // 通知房间内其他用户
  broadcast({
    type: 'system',
    message: `${clientId} joined the room`
  }, roomName, clientId)
  
  console.log(`Client ${clientId} joined room ${roomName}`)
}

function leaveRoom(clientId, roomName) {
  if (!roomName) return
  
  const room = rooms.get(roomName)
  if (room) {
    room.delete(clientId)
    if (room.size === 0) {
      rooms.delete(roomName)
    }
  }
  
  const client = clients.get(clientId)
  if (client) {
    client.room = null
  }
  
  broadcast({
    type: 'system',
    message: `${clientId} left the room`
  }, roomName)
}

// 广播消息
function broadcast(data, roomName, excludeClientId = null) {
  const message = JSON.stringify({
    type: 'message',
    data,
    timestamp: Date.now()
  })
  
  if (roomName) {
    // 房间内广播
    const room = rooms.get(roomName)
    if (room) {
      room.forEach(clientId => {
        if (clientId !== excludeClientId) {
          const client = clients.get(clientId)
          if (client?.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message)
          }
        }
      })
    }
  } else {
    // 全局广播
    clients.forEach((client, id) => {
      if (id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    })
  }
}

// 私聊
function sendDirectMessage(fromId, toId, data) {
  const target = clients.get(toId)
  if (target?.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify({
      type: 'dm',
      from: fromId,
      data,
      timestamp: Date.now()
    }))
  }
}

function generateClientId() {
  return Math.random().toString(36).substring(2, 15)
}

server.listen(8080, () => {
  console.log('WebSocket server running on port 8080')
})
```

### 客户端实现

```javascript
// client.js
class ChatClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
  }
  
  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('Connected to server')
      this.reconnectAttempts = 0
      this.emit('connected')
    }
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }
    
    this.ws.onclose = (event) => {
      console.log('Connection closed:', event.code, event.reason)
      this.emit('disconnected', event)
      this.attemptReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'system':
        console.log('System:', message.message)
        if (message.clientId) {
          this.clientId = message.clientId
        }
        break
      case 'message':
        this.emit('message', message.data)
        break
      case 'dm':
        this.emit('directMessage', message)
        break
      case 'pong':
        const latency = Date.now() - message.time
        this.emit('pong', latency)
        break
    }
  }
  
  send(type, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }))
    } else {
      console.warn('WebSocket not connected')
    }
  }
  
  join(room) {
    this.send('join', { room })
  }
  
  leave() {
    this.send('leave', {})
  }
  
  broadcast(data) {
    this.send('broadcast', { data })
  }
  
  dm(to, data) {
    this.send('dm', { to, data })
  }
  
  ping() {
    this.send('ping', { time: Date.now() })
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * this.reconnectAttempts
      
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
      this.emit('reconnect_failed')
    }
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }
  
  disconnect() {
    this.ws?.close()
  }
}

// 使用示例
const client = new ChatClient('ws://localhost:8080')

client.on('connected', () => {
  client.join('general')
  client.broadcast({ text: 'Hello everyone!' })
})

client.on('message', (data) => {
  console.log('New message:', data)
})

client.on('directMessage', ({ from, data }) => {
  console.log(`DM from ${from}:`, data)
})

client.connect()
```

## Socket.io 框架实战

### 为什么用 Socket.io？

```
Socket.io 优势:
- 自动降级 (WebSocket → 长轮询)
- 自动重连
- 房间管理内置
- 命名空间隔离
- 中间件支持
- 二进制数据传输
```

### 服务端实现

```javascript
// socket-server.js
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']  // 优先 WebSocket
})

// 中间件：认证
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  
  try {
    const user = await verifyToken(token)
    socket.user = user
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
})

// 连接处理
io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected (${socket.id})`)
  
  // 用户上线通知
  socket.broadcast.emit('user:online', {
    userId: socket.user.id,
    name: socket.user.name
  })
  
  // 加入个人房间（用于私聊）
  socket.join(`user:${socket.user.id}`)
  
  // 获取在线用户列表
  socket.on('users:getOnline', () => {
    const onlineUsers = []
    io.sockets.sockets.forEach((s) => {
      if (s.user && s.id !== socket.id) {
        onlineUsers.push({ id: s.user.id, name: s.user.name })
      }
    })
    socket.emit('users:online', onlineUsers)
  })
  
  // 群聊消息
  socket.on('message:group', async (data, callback) => {
    try {
      // 保存到数据库
      const message = await saveMessage({
        type: 'group',
        room: data.room,
        sender: socket.user.id,
        content: data.content,
        timestamp: new Date()
      })
      
      // 广播到房间
      io.to(data.room).emit('message:new', {
        id: message.id,
        sender: {
          id: socket.user.id,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        content: data.content,
        timestamp: message.timestamp
      })
      
      // 确认收到
      callback({ success: true, messageId: message.id })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
  
  // 私聊消息
  socket.on('message:private', async (data, callback) => {
    try {
      const message = await saveMessage({
        type: 'private',
        sender: socket.user.id,
        receiver: data.to,
        content: data.content
      })
      
      // 发送给接收者
      io.to(`user:${data.to}`).emit('message:private', {
        id: message.id,
        sender: {
          id: socket.user.id,
          name: socket.user.name
        },
        content: data.content,
        timestamp: message.timestamp
      })
      
      // 发送给自己（多端同步）
      socket.emit('message:private:sent', {
        id: message.id,
        to: data.to,
        content: data.content,
        timestamp: message.timestamp
      })
      
      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
  
  // 正在输入指示
  socket.on('typing:start', (data) => {
    socket.to(data.room).emit('typing:start', {
      userId: socket.user.id,
      name: socket.user.name
    })
  })
  
  socket.on('typing:stop', (data) => {
    socket.to(data.room).emit('typing:stop', {
      userId: socket.user.id
    })
  })
  
  // 加入房间
  socket.on('room:join', (roomName) => {
    socket.join(roomName)
    socket.to(roomName).emit('room:userJoined', {
      userId: socket.user.id,
      name: socket.user.name
    })
    
    // 发送房间历史消息
    getRoomHistory(roomName).then(messages => {
      socket.emit('room:history', messages)
    })
  })
  
  // 离开房间
  socket.on('room:leave', (roomName) => {
    socket.leave(roomName)
    socket.to(roomName).emit('room:userLeft', {
      userId: socket.user.id,
      name: socket.user.name
    })
  })
  
  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.user.name} disconnected: ${reason}`)
    
    socket.broadcast.emit('user:offline', {
      userId: socket.user.id
    })
  })
})

// 命名空间：实时协作编辑
const editorNamespace = io.of('/editor')

editorNamespace.use(async (socket, next) => {
  // 文档权限验证
  const docId = socket.handshake.query.docId
  const user = socket.user
  
  if (await canEditDocument(user.id, docId)) {
    socket.docId = docId
    next()
  } else {
    next(new Error('Access denied'))
  }
})

editorNamespace.on('connection', (socket) => {
  const docId = socket.docId
  socket.join(`doc:${docId}`)
  
  // 操作转换 (Operational Transformation)
  socket.on('op', async (operation, callback) => {
    try {
      // 应用操作到文档
      const result = await applyOperation(docId, operation)
      
      // 广播给其他协作者
      socket.to(`doc:${docId}`).emit('op', {
        operation: result.operation,
        clientId: socket.id
      })
      
      callback({ success: true, revision: result.revision })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
  
  // 光标位置同步
  socket.on('cursor:move', (position) => {
    socket.to(`doc:${docId}`).emit('cursor:move', {
      clientId: socket.id,
      user: socket.user,
      position
    })
  })
})

httpServer.listen(3001, () => {
  console.log('Socket.io server running on port 3001')
})
```

### 客户端 React Hook

```typescript
// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  url: string
  token: string
  autoConnect?: boolean
}

export function useSocket({ url, token, autoConnect = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [transport, setTransport] = useState('N/A')
  
  useEffect(() => {
    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect
    })
    
    socketRef.current = socket
    
    socket.on('connect', () => {
      setIsConnected(true)
      setTransport(socket.io.engine.transport.name)
    })
    
    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('Disconnected:', reason)
    })
    
    socket.io.engine.on('upgrade', (transport) => {
      setTransport(transport.name)
    })
    
    return () => {
      socket.disconnect()
    }
  }, [url, token, autoConnect])
  
  const sendMessage = useCallback((event: string, data: any) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'))
        return
      }
      
      socketRef.current.emit(event, data, (response: any) => {
        if (response?.success) {
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Unknown error'))
        }
      })
    })
  }, [])
  
  const on = useCallback((event: string, callback: Function) => {
    socketRef.current?.on(event, callback)
    return () => socketRef.current?.off(event, callback)
  }, [])
  
  return {
    socket: socketRef.current,
    isConnected,
    transport,
    sendMessage,
    on
  }
}

// 使用示例
function ChatRoom({ roomId }: { roomId: string }) {
  const { isConnected, sendMessage, on } = useSocket({
    url: 'http://localhost:3001',
    token: localStorage.getItem('token')!
  })
  
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  
  useEffect(() => {
    const unsub1 = on('message:new', (message) => {
      setMessages(prev => [...prev, message])
    })
    
    const unsub2 = on('room:history', (history) => {
      setMessages(history)
    })
    
    // 加入房间
    sendMessage('room:join', roomId)
    
    return () => {
      unsub1()
      unsub2()
      sendMessage('room:leave', roomId)
    }
  }, [roomId])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    await sendMessage('message:group', {
      room: roomId,
      content: input
    })
    
    setInput('')
  }
  
  return (
    <div>
      <div className="status">
        {isConnected ? '🟢 已连接' : '🔴 未连接'}
      </div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.sender.name}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>发送</button>
    </div>
  )
}
```

## 性能优化

### 1. 连接池管理

```javascript
// 限制每 IP 连接数
const connectionsPerIp = new Map()

io.use((socket, next) => {
  const clientIp = socket.handshake.address
  const current = connectionsPerIp.get(clientIp) || 0
  
  if (current >= 10) {
    return next(new Error('Too many connections from this IP'))
  }
  
  connectionsPerIp.set(clientIp, current + 1)
  
  socket.on('disconnect', () => {
    connectionsPerIp.set(clientIp, (connectionsPerIp.get(clientIp) || 1) - 1)
  })
  
  next()
})
```

### 2. 消息压缩

```javascript
const io = new Server(httpServer, {
  perMessageDeflate: {
    threshold: 1024,  // 大于1KB的消息压缩
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    }
  }
})
```

### 3. 集群模式

```javascript
// 使用 Redis Adapter 实现多节点广播
const { createAdapter } = require('@socket.io/redis-adapter')
const { createClient } = require('redis')

const pubClient = createClient({ host: 'localhost', port: 6379 })
const subClient = pubClient.duplicate()

io.adapter(createAdapter(pubClient, subClient))
```

---

**你在使用 WebSocket 时遇到过哪些挑战？欢迎分享经验！** 👇
