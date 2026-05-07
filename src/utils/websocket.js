// WebSocket客户端
class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectInterval = 5000
    this.reconnectTimer = null
    this.messageHandlers = new Map()
    this.isConnected = false
    this.userId = null
  }

  connect(userId) {
    this.userId = userId
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('WebSocket: No token available')
      return
    }

    const wsUrl = `ws://localhost:8100/api/ws/${userId}?token=${token}`
    
    try {
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.clearReconnectTimer()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket received:', data)
          this.handleMessage(data)
        } catch (e) {
          console.error('WebSocket message parse error:', e)
        }
      }
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.reconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (e) {
      console.error('WebSocket connection error:', e)
    }
  }

  handleMessage(data) {
    const handlers = this.messageHandlers.get(data.type)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type).push(handler)
  }

  off(type, handler) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  reconnect() {
    if (this.reconnectTimer) return
    
    console.log(`WebSocket reconnecting in ${this.reconnectInterval/1000}s...`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.userId) {
        this.connect(this.userId)
      }
    }, this.reconnectInterval)
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  disconnect() {
    this.clearReconnectTimer()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  getStatus() {
    return this.isConnected ? 'connected' : 'disconnected'
  }
}

export const websocketClient = new WebSocketClient()
export default websocketClient
