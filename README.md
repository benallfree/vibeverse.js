# Vibeverse.js

A JavaScript module for connecting your game to the [Vibeverse](https://x.com/hashtag/vibeverse). This module enables seamless transitions between different 3D experiences while preserving player avatars and state.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎮 Create portal connections between 3D web experiences
- 🎨 Customizable portal visuals with particle effects
- 🌟 Configurable warp transition effect
- 👤 Avatar persistence across experiences
- 🔄 Automatic portal state management
- 🎵 Smart audio handling for browser autoplay policies

## Installation

```bash
npm install vibeverse.js
```

Or use directly in your HTML:

```html
<script type="module">
  import { Vibeverse } from 'https://unpkg.com/vibeverse.js@latest/vibeverse.js'
</script>
```

## Quick Start

```javascript
import { Vibeverse } from 'vibeverse.js'

// Initialize with your Three.js scene, camera, and socket
const vibeverse = new Vibeverse(scene, camera, socket)

// Create portals in your scene
const { exitPortal, startPortal } = vibeverse.createPortals(45, 0, 45)

// Check for portal collisions in your game loop
vibeverse.checkPortalCollisions(player)
```

## API Reference

### Constructor

```javascript
new Vibeverse(scene, camera, socket, warpConfig)
```

- `scene`: THREE.Scene - Your Three.js scene
- `camera`: THREE.Camera - Your Three.js camera
- `socket`: WebSocket - Your WebSocket connection
- `warpConfig`: Object (optional) - Configuration for the warp effect

### Methods

#### `createPortals(x, y, z, radius, options)`

Creates both start and exit portals in your scene.

- `x`: number (default: 45) - X coordinate
- `y`: number (default: 0) - Y coordinate
- `z`: number (default: 45) - Z coordinate
- `radius`: number (default: 6) - Portal radius
- `options`: Object (optional) - Additional portal options

Returns an object containing:

- `exitPortal`: THREE.Group - The exit portal mesh
- `startPortal`: THREE.Group - The start portal mesh (null if not created)

#### `checkPortalCollisions(player)`

Checks for collisions between the player and portals.

- `player`: Object - Player object with position property

#### `toggleWarpEffect(enable)`

Toggles the warp transition effect on/off.

- `enable`: boolean - Whether to enable the warp effect

### Adding your game to the Vibeverse

The Vibeverse is built on a system of portals and URL parameters that enable seamless transitions between different 3D experiences. When a player enters your game through a portal, they'll arrive with their avatar and identity preserved.

#### Portal Types

- **Exit Portal (Green)**: Takes players to the Vibeverse hub
- **Start Portal (Red)**: Returns players to their previous game (only appears when `ref` parameter is present)

#### URL Parameters

When players enter your game through a portal, they'll arrive with the following URL parameters:

- `ref`: The URL of the game they came from (e.g. `?ref=yourgame.com`)
- `portal`: Set to 'true' when coming from another experience
- `username`: The player's name/identifier
- `avatar`: The player's avatar, which can be:
  - A direct URL to a GLB file (e.g. `?avatar=https://example.com/avatar.glb`)
  - A username for Vibatar.ai (e.g. `?avatar=player123`), which will resolve to `https://vibatar.ai/player123.glb`
- `color`: Avatar color preference

For more information about Vibatar.ai avatars, visit [https://vibatar.ai](https://vibatar.ai).

### Helper Functions

#### `isVibeverse()`

Returns a boolean indicating if the user is coming from a Vibeverse portal.

## Warp Effect Configuration

You can customize the warp effect by passing a configuration object:

```javascript
const warpConfig = {
  lineCount: 1000,
  pointsPerLine: 8,
  tunnelRadius: 2,
  tunnelExpansion: 0.5,
  minSpeed: 0.8,
  speedVariation: 0.2,
  oscillationSpeed: 2,
  minSpeedFactor: 0.5,
  lineLength: 3,
  resetDistance: 20,
  resetOffset: 20,
  cameraSpeed: 2.0,
  cameraAcceleration: 0.1,
}
```

## Audio Handling

When bypassing splash screens, the module includes a helper for handling browser autoplay policies:

```javascript
// Setup one-time interaction handler
const enableAudioOnInteraction = (event) => {
  document.removeEventListener('click', enableAudioOnInteraction)
  document.removeEventListener('touchstart', enableAudioOnInteraction)
  // Start your audio here
  // yourAudioSystem.start();
}

// Add listeners for both mouse and touch events
document.addEventListener('click', enableAudioOnInteraction)
document.addEventListener('touchstart', enableAudioOnInteraction)
```

## License

MIT License - see LICENSE file for details
