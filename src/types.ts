import type {
  Box3,
  BufferGeometry,
  Camera,
  Euler,
  Group,
  LineSegments,
  Matrix4,
  Quaternion,
  Scene,
  Vector3,
} from 'three'

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
}

// Navigation component interface
export interface Navigation {
  element: HTMLElement
  show: () => void
  hide: () => void
}

// Interface for the Vibeverse state
export interface VibeverseState {
  scene: Scene
  camera: Camera
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
}

// Interface for the Vibeverse instance
export interface VibeverseInstance {
  createPortals: (
    x?: number,
    y?: number,
    z?: number,
    radius?: number,
    options?: VibeverseOptions
  ) => {
    exitPortal: Group
    startPortal: Group | null
  }
  checkPortalCollisions: (player: { position: Vector3 }) => void
  update: () => void
  toggleWarpEffect: (enable: boolean) => void
  navigation: Navigation
}

// Extend Three.js types
declare module 'three' {
  interface Object3DUserData {
    particlesGeometry?: BufferGeometry
    type?: 'entrance' | 'exit'
    portal?: Group
    velocities?: Float32Array
    timingOffsets?: Float32Array
    basePosition?: Vector3
    transformedPosition?: Vector3
    matrix?: Matrix4
    startTime?: number
  }

  interface Group {
    position: Vector3
    rotation: Euler
    quaternion: Quaternion
  }

  interface Mesh {
    position: Vector3
  }
}
