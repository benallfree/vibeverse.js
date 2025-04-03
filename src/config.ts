import * as THREE from 'three'
import { PartialDeep } from 'type-fest'
import type { VibeverseOptions, WarpConfig } from './types'
import { DEFAULT_WARP_CONFIG } from './warpEffect'

// Root level defaults that portals will inherit
const DEFAULT_VIBEVERSE_OPTIONS: VibeverseOptions = {
  // Root level defaults that portals will inherit
  position: new THREE.Vector3(0, 0, 0),
  lookAt: new THREE.Euler(0, Math.PI, 0),
  username: '',
  warpConfig: DEFAULT_WARP_CONFIG,
  avatarConfig: {
    useBottomOrigin: false,
    allowedDomains: ['vibatar.ai'],
  },

  // Portal-specific defaults that only apply if not overridden by root
  enter: {
    label: 'Go back',
    color: '#ff0000',
    radius: 6,
    position: new THREE.Vector3(0, 0, 0), // Will be computed
    lookAt: new THREE.Euler(0, Math.PI, 0), // Will be inherited from root
  },

  exit: {
    label: 'To Vibeverse',
    color: '#00ff00',
    radius: 6,
    position: new THREE.Vector3(0, 0, 0), // Will be computed
    lookAt: new THREE.Euler(0, Math.PI, 0), // Will be inherited from root
  },
}

// Helper to compute portal positions based on root position and portal radii
const computePortalPositions = (
  rootPosition: THREE.Vector3,
  enterRadius: number,
  exitRadius: number
): { enter: THREE.Vector3; exit: THREE.Vector3 } => {
  // Calculate spacing to prevent portal overlap
  const spacing = Math.max(enterRadius, exitRadius) * 2.5 // 2.5x radius for comfortable spacing

  return {
    enter: new THREE.Vector3(rootPosition.x - spacing, rootPosition.y, rootPosition.z),
    exit: new THREE.Vector3(rootPosition.x + spacing, rootPosition.y, rootPosition.z),
  }
}

// Helper to create a Vector3 from a partial Vector3
const createVector3 = (v?: Partial<THREE.Vector3>): THREE.Vector3 => {
  return new THREE.Vector3(v?.x ?? 0, v?.y ?? 0, v?.z ?? 0)
}

// Helper to create an Euler from a partial Euler
const createEuler = (e?: Partial<THREE.Euler>): THREE.Euler => {
  return new THREE.Euler(e?.x ?? 0, e?.y ?? 0, e?.z ?? 0)
}

// Helper to merge warp config
const mergeWarpConfig = (config?: PartialDeep<WarpConfig> | null): WarpConfig => {
  return {
    ...DEFAULT_WARP_CONFIG,
    ...(config ?? {}),
  }
}

export function computeVibeverseOptions(options?: PartialDeep<VibeverseOptions>): VibeverseOptions {
  // Create base options with proper THREE.js objects
  const baseOptions = {
    position: createVector3(options?.position),
    lookAt: createEuler(options?.lookAt),
    username: options?.username ?? '',
    warpConfig: mergeWarpConfig(options?.warpConfig),
    avatarConfig: {
      useBottomOrigin: options?.avatarConfig?.useBottomOrigin ?? DEFAULT_VIBEVERSE_OPTIONS.avatarConfig.useBottomOrigin,
      allowedDomains: options?.avatarConfig?.allowedDomains ?? DEFAULT_VIBEVERSE_OPTIONS.avatarConfig.allowedDomains,
    },
  }

  // Create portal options with proper THREE.js objects
  const enterOptions = {
    ...DEFAULT_VIBEVERSE_OPTIONS.enter,
    position: createVector3(options?.enter?.position ?? options?.position),
    lookAt: createEuler(options?.enter?.lookAt ?? options?.lookAt),
    label: options?.enter?.label ?? DEFAULT_VIBEVERSE_OPTIONS.enter.label,
    color: options?.enter?.color ?? DEFAULT_VIBEVERSE_OPTIONS.enter.color,
    radius: options?.enter?.radius ?? DEFAULT_VIBEVERSE_OPTIONS.enter.radius,
  }

  const exitOptions = {
    ...DEFAULT_VIBEVERSE_OPTIONS.exit,
    position: createVector3(options?.exit?.position ?? options?.position),
    lookAt: createEuler(options?.exit?.lookAt ?? options?.lookAt),
    label: options?.exit?.label ?? DEFAULT_VIBEVERSE_OPTIONS.exit.label,
    color: options?.exit?.color ?? DEFAULT_VIBEVERSE_OPTIONS.exit.color,
    radius: options?.exit?.radius ?? DEFAULT_VIBEVERSE_OPTIONS.exit.radius,
  }

  // Compute portal positions if not explicitly set
  if (!options?.enter?.position && !options?.exit?.position) {
    const positions = computePortalPositions(baseOptions.position, enterOptions.radius, exitOptions.radius)

    enterOptions.position = positions.enter
    exitOptions.position = positions.exit
  }

  return {
    ...baseOptions,
    enter: enterOptions,
    exit: exitOptions,
  }
}
