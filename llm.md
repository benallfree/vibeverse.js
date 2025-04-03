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

Updates portal state. Should be called in your game loop.

#### navigation

A navigation component that provides UI elements for portal interaction.

## Configuration Options

The `VibeverseOptions` interface includes:

### Root Level Options

- `position`: THREE.Vector3 - Base position for portals (default: 0,0,0)
- `lookAt`: THREE.Euler - Base rotation for portals (default: 0,π,0)
- `username`: string - User identifier (default: '')
- `warpConfig`: WarpConfig | null - Configuration for warp effect

### Portal-Specific Options

Each portal (enter/exit) can be configured with:

- `label`: string - Portal label text
- `color`: string - Portal color (hex)
- `radius`: number - Portal size
- `position`: THREE.Vector3 - Portal position
- `lookAt`: THREE.Euler - Portal rotation

## Warp Effect Configuration

The warp effect can be customized with the following options:

```typescript
interface WarpConfig {
  lineCount: number // Number of lines in the effect
  pointsPerLine: number // Points per line
  tunnelRadius: number // Base tunnel radius
  tunnelExpansion: number // How much tunnel expands
  minSpeed: number // Minimum line speed
  speedVariation: number // Random speed variation
  oscillationSpeed: number // Wave oscillation speed
  minSpeedFactor: number // Minimum speed factor
  lineLength: number // Length of each line
  resetDistance: number // Distance before reset
  resetOffset: number // Reset offset
  cameraSpeed: number // Camera movement speed
  cameraAcceleration: number // Camera acceleration
}
```

## URL Parameters

When users enter through a portal, the following URL parameters are available:

- `ref`: URL of the source game
- `portal`: Set to 'true' when coming from another experience
- `username`: Player's identifier
- `avatar`: Player's avatar URL or Vibatar.ai username
- `color`: Avatar color preference

## Helper Functions

### isVibeverse()

```typescript
function isVibeverse(): boolean
```

Returns true if the user is coming from a Vibeverse portal.

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
})

// Create portals
const { exitPortal, startPortal } = vibeverseInstance.createPortals()

// In your game loop
function gameLoop() {
  vibeverseInstance.update()
  requestAnimationFrame(gameLoop)
}
```
