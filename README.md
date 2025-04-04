[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![npm](https://img.shields.io/npm/dm/vibeverse.js.svg)](https://www.npmjs.com/package/vibeverse.js) [![GitHub stars](https://img.shields.io/github/stars/benallfree/vibeverse.js.svg?style=social&label=Stars)](https://github.com/benallfree/vibeverse.js)

# Vibeverse.js

A JavaScript module for connecting your game to the [Vibeverse](https://x.com/hashtag/vibeverse). This module enables seamless transitions between different 3D experiences while preserving player avatars and state.

![image](https://github.com/user-attachments/assets/602013a8-f4eb-4e43-9a0e-f0e36c843327)

https://github.com/user-attachments/assets/5408048d-c1ea-4b20-909c-226d45c66461

## Features

- 🎮 Create portal connections between 3D web experiences
- 🎨 Customizable portal visuals with particle effects
- 🌟 Configurable warp transition effect
- 👤 Avatar persistence across experiences with Vibatar.ai integration
- 🔄 Automatic portal state management
- 🎵 Smart audio handling for browser autoplay policies
- 🔍 Debug build available for development
- 🎯 Side-by-side portal positioning with automatic spacing
- 🎨 Customizable portal colors, labels, and sizes
- ⚡ Automatic avatar loading throttling to prevent browser overload

## Installation

Directly in your HTML (recommended):

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three/+esm",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three/examples/jsm/"
    }
  }
</script>
<script type="module">
  // Production build
  import { vibeverse } from 'https://cdn.jsdelivr.net/npm/vibeverse.js/+esm'

  // Debug build with source maps
  import { vibeverse } from 'https://cdn.jsdelivr.net/npm/vibeverse.js@latest/dist/vibeverse.debug.js'
</script>
```

Or from a package manager:

```bash
npm install vibeverse.js three
```

```ts
import { vibeverse } from 'vibeverse.js'
// For development with source maps:
import { vibeverse } from 'vibeverse.js/debug'
```

## Quick Start

```typescript
import { vibeverse } from 'https://cdn.jsdelivr.net/npm/vibeverse.js/+esm'

// Initialize Vibeverse
const vibeverseInstance = vibeverse(scene, camera, player, {
  username: 'player123',
  warpConfig: {
    lineCount: 1000,
    pointsPerLine: 8,
    tunnelRadius: 2,
    // ... other warp config options
  },
  avatarConfig: {
    useBottomOrigin: false,
    allowedDomains: ['vibatar.ai'],
    maxConcurrent: 5, // Maximum number of concurrent avatar loads
  },
})

// Create 3D portals in your game world
const { exitPortal, startPortal } = vibeverseInstance.createInGamePortals()

// Or create HUD portals for UI-based navigation
const hudPortals = vibeverseInstance.createHUDPortals()

// In your game loop
function gameLoop() {
  vibeverseInstance.update()
  requestAnimationFrame(gameLoop)
}
```

## MMO Integration

Vibeverse.js provides events for avatar changes that can be used to synchronize avatars across multiple players in an MMO scenario.

### Broadcasting Local Avatar Changes

When a local player's avatar changes, you can broadcast it to other players:

```typescript
const vv = vibeverse(scene, camera, localPlayer, options)

// Listen for local avatar changes and broadcast them
vv.onLocalAvatarChanged((event) => {
  // Assuming you have a socket connection
  socket.emit('avatar:changed', {
    playerId: localPlayer.id, // Your game's player ID system
    avatarUrl: event.avatarUrlOrUsername,
  })
})
```

### Receiving Remote Avatar Changes

On the receiving end, listen for avatar changes from other players:

```typescript
const vv = vibeverse(scene, camera, localPlayer, options)

// Handle incoming socket messages
socket.on('avatar:changed', (data) => {
  // Get the remote player object using your game's player management system
  const remotePlayer = getRemotePlayerObjectBySocketId(data.playerId)
  if (remotePlayer) {
    // Load the new avatar for the remote player
    vv.swapAvatar(remotePlayer, data.avatarUrl)
  }
})
```

### Complete MMO Example

Here's a more complete example showing how to integrate with a typical MMO setup:

```typescript
// In your game's main file
const vv = vibeverse(scene, camera, localPlayer, options)

// When a player joins
socket.on('player:join', (data) => {
  // Create remote player object
  const remotePlayer = createPlayerObject(data.position)

  // If they have an avatar, load it
  // Vibeverse automatically throttles concurrent avatar loads to prevent browser overload
  if (data.avatar) {
    vv.swapAvatar(remotePlayer, data.avatar)
  }
})

// Listen for local avatar changes to broadcast
vv.onLocalAvatarChanged((event) => {
  socket.emit('avatar:changed', {
    playerId: localPlayer.id,
    avatarUrl: event.avatarUrlOrUsername,
  })
})

// Listen for remote avatar changes
vv.onRemoteAvatarChanged((event) => {
  console.log(`Remote player ${event.player.id} changed avatar`)
})

// When a player leaves
socket.on('player:leave', (data) => {
  // Your game's cleanup logic
  removePlayer(data.playerId)
})
```
