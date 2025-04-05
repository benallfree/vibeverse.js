---
description: Implementation guide for deploying Vibeverse.js games using Cloudflare Workers, Durable Objects, and Static Site Generation with Bun
globs:
alwaysApply: true
---

# Cloudflare Workers + Durable Objects + SSG with Bun

This guide is designed to help LLMs understand how to implement and deploy Vibeverse.js games using modern web infrastructure. It provides a complete example of setting up a real-time application using Cloudflare Workers, Durable Objects, and Static Site Generation (SSG) with Bun as the development environment.

## Project Structure

```
myvibegame/
├── client/          # Vike + React frontend
└── server/          # Cloudflare Worker + Durable Object backend
```

## Server Setup

### 1. Initialize Server Project

```bash
mkdir server
cd server
bun init
```

### 2. Install Dependencies

```bash
bun add -d typescript @types/bun
```

### 3. Configure Cloudflare Worker

Create `wrangler.toml`:

```toml
name = "myvibegame"
main = "src/index.ts"
compatibility_date = "2024-04-04"

[[durable_objects.bindings]]
class_name = "GameServer"
name = "GAME_SERVER"

[[migrations]]
tag = "v1"
new_classes = ["GameServer"]

[observability]
enabled = true
```

### 4. Implement Durable Object

Create `src/GameServer_DurableObject.ts`:

```typescript
import { DurableObject } from 'cloudflare:workers'

export class GameServer extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    this.ctx.acceptWebSocket(server)

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const data = JSON.parse(message)

    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', message: 'Hello from server!' }))
        break
      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`,
          })
        )
        break
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, 'Durable Object is closing WebSocket')
  }
}
```

### 5. Implement Worker

Create `src/worker.ts`:

```typescript
interface Env {
  GAME_SERVER: DurableObjectNamespace<GameServer>
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // CORS headers must be included in ALL responses, including errors and WebSocket upgrades
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const id = env.GAME_SERVER.idFromName('main')
    const stub = env.GAME_SERVER.get(id)

    const url = new URL(request.url)
    const path = url.pathname

    if (path.startsWith('/websocket')) {
      // Forward the request to the Durable Object
      const response = await stub.fetch(request)
      // Ensure CORS headers are present in the WebSocket upgrade response
      const newHeaders = new Headers(response.headers)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value)
      })
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    }

    return new Response('Not found', {
      status: 404,
      headers: corsHeaders,
    })
  },
}
```

### 6. Deploy Server

```bash
bunx wrangler deploy
```

## Client Setup

### 1. Initialize Client Project

```bash
bun create vike@latest --react --tailwindcss --daisyui client
```

### 2. Configure Vike

Create `+config.ts`:

```typescript
export default {
  prerender: true,
}
```

### 3. Create WebSocket Client Component

Create `components/WebSocketClient.tsx`:

```typescript
import { useEffect, useRef } from 'react'

export function WebSocketClient() {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('wss://myvibegame.workers.dev/websocket')
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'pong':
          console.log(data.message)
          break
        case 'error':
          console.error(data.message)
          break
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendPing = () => {
    wsRef.current?.send(JSON.stringify({ type: 'ping' }))
  }

  return (
    <div>
      <button onClick={sendPing}>Send Ping</button>
    </div>
  )
}
```

### 4. Deploy Client

```bash
# Build static site
bun run build

# Deploy to Cloudflare Pages
bunx wrangler pages deploy dist
```

## Development Workflow

1. Start server development:

```bash
cd server
bunx wrangler dev
```

2. Start client development:

```bash
cd client
bun run dev
```

## Key Features

1. **Hibernatable WebSockets**

   - Uses `ctx.acceptWebSocket()` for efficient memory management
   - Durable Objects can be evicted during inactivity
   - Connections remain alive even when DO is hibernated

2. **Message Protocol**

   - JSON-based message format
   - Structured with `type` and `message` fields
   - Built-in error handling

3. **CORS Support**
   - CORS headers must be included in ALL responses, including:
     - Regular HTTP responses
     - Error responses
     - WebSocket upgrade responses
     - Preflight (OPTIONS) requests
   - Headers are consistently applied across all endpoints
   - Prevents cross-origin issues in development and production

## Notes

- The Durable Object ID is derived from the name 'main' - adjust as needed
- Consider adding authentication for production use
- Add error handling and reconnection logic for WebSocket client
- Always include CORS headers in responses to prevent browser security errors
