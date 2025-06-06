import type { Box3, Camera, Euler, Group, LineSegments, Object3D, Scene, Vector3 } from 'three'
import type { Event } from './event'

// Configuration for the warp effect
export interface WarpConfig {
  lineCount: number
  pointsPerLine: number
  tunnelRadius: number
  tunnelExpansion: number
  minSpeed: number
  speedVariation: number
  oscillationSpeed: number
  minSpeedFactor: number
  lineLength: number
  resetDistance: number
  resetOffset: number
  cameraSpeed: number
  cameraAcceleration: number
}

export interface PortalOptions {
  label: string
  color: string
  lookAt: Euler
  position: Vector3
  radius: number
}

// Options for portal customization
export interface VibeverseOptions {
  enter: PortalOptions
  exit: PortalOptions
  position: Vector3
  lookAt: Euler
  username: string
  warpConfig: WarpConfig | null
  avatarConfig: {
    useBottomOrigin: boolean
    allowedDomains: string[]
    maxConcurrent: number
  }
}

// Navigation component interface
export interface Navigation {
  element: HTMLElement
  show: () => void
  hide: () => void
}

export type AvatarChangedEvent = {
  player: Object3D
  avatarUrlOrUsername: string
}

// Interface for the Vibeverse state
export interface VibeverseState {
  scene: Scene
  camera: Camera
  player: Object3D
  warpConfig: WarpConfig | null
  options: VibeverseOptions
  startPortal: Group | null
  exitPortal: Group | null
  startPortalBox: Box3 | null
  exitPortalBox: Box3 | null
  enableWarpEffect: boolean
  warpEffect: LineSegments | null
  isWarping: boolean
  cameraDirection: Vector3
  currentCameraSpeed: number
  onLocalAvatarChanged: Event<AvatarChangedEvent>
  onRemoteAvatarChanged: Event<AvatarChangedEvent>
}

// Interface for the Vibeverse instance
export interface VibeverseInstance {
  createInGamePortals: () => {
    exitPortal: Group
    startPortal: Group | null
  }
  update: () => void
  createHUDPortals: () => Navigation
  swapAvatar: (targetPlayer: Object3D, avatarUrlOrUsername: string) => Promise<void>
  onLocalAvatarChanged: (callback: (event: AvatarChangedEvent) => void) => () => void
  onRemoteAvatarChanged: (callback: (event: AvatarChangedEvent) => void) => () => void
}
