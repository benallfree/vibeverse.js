---
description: Vibeverse.js API Documentation
globs:
alwaysApply: true
---

# Vibeverse.js API Documentation

## Overview

Vibeverse.js is a JavaScript module that enables seamless transitions between different 3D web experiences using Three.js. It provides a portal system that allows players to move between different games while preserving their avatar and state.

## Core Function: vibeverse()

```typescript
function vibeverse(
  scene: THREE.Scene,
  camera: THREE.Camera,
  player: THREE.Object3D,
  options?: PartialDeep<VibeverseOptions>
): VibeverseInstance
```

### Parameters

- `scene`: THREE.Scene - The Three.js scene where portals will be created
- `camera`: THREE.Camera - The Three.js camera used for the player's view
- `player`: THREE.Object3D - The player's 3D object that will interact with portals
- `options`: PartialDeep<VibeverseOptions> (optional) - Configuration options for the Vibeverse instance

### Return Value

Returns a `VibeverseInstance` object with the following methods:

#### createInGamePortals()

```typescript
createInGamePortals: () => {
  exitPortal: THREE.Group,
  startPortal: THREE.Group | null
}
```

Creates 3D portal objects in your game scene. The exit portal is always created, while the start portal only appears when the user is coming from another Vibeverse experience. Use this method when you want to create physical portal objects that players can interact with in your 3D world.

#### createHUDPortals()

```typescript
createHUDPortals: () => Navigation
```

Creates UI elements for portal interaction that overlay your game view. This is useful when you want to provide a more traditional UI-based navigation experience, separate from the 3D world portals. The HUD portals will appear as overlay elements that players can click to navigate.

Returns a `Navigation` object with:

- `element`: The HTML element containing the navigation UI
- `show()`: Function to show the navigation UI
- `hide()`: Function to hide the navigation UI

You can use either or both methods depending on your needs:

- Use `createInGamePortals()` for immersive 3D portal experiences where players physically move through portals in your game world
- Use `createHUDPortals()` for traditional UI-based navigation that doesn't require 3D portal objects
- Use both when you want to support both interaction methods

#### update()

```typescript
update: () => void
```

Allow vibeverse to perform frame-based updates such as portal collision detection. Should be called in your game loop.

#### swapAvatar()

```typescript
swapAvatar: (targetPlayer: THREE.Object3D, avatarUrlOrUsername: string) => Promise<void>
```

Load and swap an avatar onto any player object. This can be used for both local and remote players.

- `targetPlayer`: The THREE.Object3D to apply the avatar to
- `avatarUrlOrUsername`: Either a direct URL to a GLB file or a username that will be converted to a Vibatar.ai URL

The avatar will be scaled to match the target player's size and aligned according to the avatarConfig settings.

#### onAvatarChanged()

```typescript
onAvatarChanged: (callback: (player: THREE.Object3D, avatarUrlOrUsername: string) => void) => () => void
```

Register a callback that will be called whenever any player's avatar is loaded or changed.

- `callback`: Function that receives the player object and the avatar URL/username
- Returns: An unsubscribe function that removes the callback when called

Multiple callbacks can be registered and will all be called when an avatar changes.

#### onLocalAvatarChanged()

```typescript
onLocalAvatarChanged: (callback: (player: THREE.Object3D, avatarUrlOrUsername: string) => void) => () => void
```

Register a callback that will be called specifically when the local player's avatar is loaded or changed.

- `callback`: Function that receives the player object and the avatar URL/username
- Returns: An unsubscribe function that removes the callback when called

Multiple callbacks can be registered and will all be called when the local avatar changes. This is useful for broadcasting local avatar changes to other players in an MMO scenario.

Example usage:

```typescript
const vv = vibeverse(scene, camera, player, options)

// Register callbacks
const unsubscribe1 = vv.onAvatarChanged((player, avatarUrl) => {
  console.log(`Player ${player.id} changed avatar to ${avatarUrl}`)
})

const unsubscribe2 = vv.onLocalAvatarChanged((player, avatarUrl) => {
  socket.emit('avatar:changed', { avatarUrl })
})

// Later, when you want to stop listening:
unsubscribe1()
unsubscribe2()
```

## Configuration Options

The `VibeverseOptions` interface includes:

### Root Level Options

- `position`: THREE.Vector3 - Base position for portals (default: 0,0,0)
- `lookAt`: THREE.Euler - Base rotation for portals (default: 0,π,0)
- `username`: string - User identifier (default: '')
- `warpConfig`: WarpConfig | null - Configuration for warp effect
- `avatarConfig`: AvatarConfig - Configuration for avatar loading and handling

### Portal-Specific Options

Each portal (enter/exit) can be configured with:

- `label`: string - Portal label text
- `color`: string - Portal color (hex)
- `radius`: number - Portal size
- `position`: THREE.Vector3 - Portal position (optional, will be computed if not provided)
- `lookAt`: THREE.Euler - Portal rotation (optional, will inherit from root if not provided)

Default portal settings:

- Enter portal: Red (#ff0000), radius 6, label "Go back"
- Exit portal: Green (#00ff00), radius 6, label "To Vibeverse"

### Avatar Configuration

The `avatarConfig` options include:

- `useBottomOrigin`: boolean - Whether to align avatars from their bottom (default: false)
- `allowedDomains`: string[] - List of allowed domains for avatar loading (default: ['vibatar.ai'])
- `maxConcurrent`: number - Maximum number of concurrent avatar loads (default: 5). This helps prevent overwhelming the browser when many avatars need to be loaded simultaneously.

## Warp Effect Configuration

The warp effect can be customized with the following options:

```typescript
interface WarpConfig {
  // Line configuration
  lineCount: number // Number of lines in the effect (default: 1000)
  pointsPerLine: number // Points per line (default: 8)
  lineLength: number // Length of each line (default: 3)

  // Tunnel configuration
  tunnelRadius: number // Base tunnel radius (default: 2)
  tunnelExpansion: number // How much tunnel expands (default: 0.5)

  // Animation configuration
  minSpeed: number // Minimum line speed (default: 0.8)
  speedVariation: number // Random speed variation (default: 0.2)
  oscillationSpeed: number // Wave oscillation speed (default: 2)
  minSpeedFactor: number // Minimum speed factor (default: 0.5)

  // Reset configuration
  resetDistance: number // Distance before reset (default: 20)
  resetOffset: number // Reset offset (default: 20)

  // Camera configuration
  cameraSpeed: number // Camera movement speed (default: 2.0)
  cameraAcceleration: number // Camera acceleration (default: 0.1)
}
```

## URL Parameters

When users enter through a portal, the following URL parameters are available:

- `ref`: URL of the source game
- `portal`: Set to 'true' when coming from another experience
- `username`: Player's identifier
- `avatar`: Player's avatar URL or Vibatar.ai username
- `color`: Avatar color preference

## Navigation

The navigation system uses the following default URLs:

- Portal URL: https://portal.pieter.com
- Navigation UI appears in the bottom-left corner of the screen

## Helper Functions

### isVibeverse()

```typescript
function isVibeverse(): boolean
```

Returns true if the user is coming from a Vibeverse portal.

## Debug Build

For development purposes, a debug build is available that includes source maps:

```typescript
import { vibeverse } from 'vibeverse.js/debug'
```

## Example Usage

```typescript
import { vibeverse } from 'vibeverse.js'

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
  },
})

// Create portals
const { exitPortal, startPortal } = vibeverseInstance.createInGamePortals()

// In your game loop
function gameLoop() {
  vibeverseInstance.update()
  requestAnimationFrame(gameLoop)
}
```
