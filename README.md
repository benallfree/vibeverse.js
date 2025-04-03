# Vibeverse.js

A JavaScript module for connecting your game to the [Vibeverse](https://x.com/hashtag/vibeverse). This module enables seamless transitions between different 3D experiences while preserving player avatars and state.

![image](https://github.com/user-attachments/assets/602013a8-f4eb-4e43-9a0e-f0e36c843327)

https://github.com/user-attachments/assets/5408048d-c1ea-4b20-909c-226d45c66461

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dm/vibeverse.js.svg)](https://www.npmjs.com/package/vibeverse.js)
[![GitHub stars](https://img.shields.io/github/stars/benallfree/vibeverse.js.svg?style=social&label=Stars)](https://github.com/benallfree/vibeverse.js)

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
  import { vibeverse } from 'https://unpkg.com/vibeverse.js@latest'
</script>
```

## Quick Start

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

## API Documentation

For detailed API documentation, including all available options, methods, and configuration settings, please refer to [llm.md](llm.md).

> 💡 **Tip for LLM IDEs**: If you're using an LLM-powered IDE (like Cursor), consider adding `llm.md` to your IDE's rules or RAG system. This will help the AI better understand the Vibeverse.js API and provide more accurate code suggestions and completions.

## Dependencies

- Three.js >= 0.150.0

## License

MIT License - see LICENSE file for details
