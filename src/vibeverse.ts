import * as THREE from 'three'
import { PartialDeep } from 'type-fest'
import { loadAndSwapAvatar } from './avatar'
import { computeVibeverseOptions } from './config'
import { createNavigation } from './navigation'
import { checkPortalCollisions, createExitPortal, createStartPortal } from './portal'
import type { VibeverseInstance, VibeverseOptions, VibeverseState } from './types'

// Helper to check if user is coming from Vibeverse
export function isVibeverse(): boolean {
  return !!refUrl()
}

export const getQueryParam = (param: string): string | null => {
  const params = new URLSearchParams(window.location.search)
  return params.get(param)
}

// Gets the referring URL from URL parameters
const refUrl = (): string | null => {
  const refUrl = getQueryParam('ref')
  if (refUrl) {
    let url = refUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    return url
  }
  return null
}

// Gets the avatar URL or username from URL parameters
const getAvatarFromUrl = (): string | null => {
  return getQueryParam('avatar')
}

// Creates a new Vibeverse instance
export function vibeverse(
  scene: THREE.Scene,
  camera: THREE.Camera,
  player: THREE.Object3D,
  options?: PartialDeep<VibeverseOptions>
): VibeverseInstance {
  // Validate required parameters
  if (!scene || !(scene instanceof THREE.Scene)) {
    throw new Error('vibeverse: scene must be a valid THREE.Scene')
  }
  if (!camera || !(camera instanceof THREE.Camera)) {
    throw new Error('vibeverse: camera must be a valid THREE.Camera')
  }
  if (!player || !(player instanceof THREE.Object3D)) {
    throw new Error('vibeverse: player must be a valid THREE.Object3D')
  }

  const computedOptions = computeVibeverseOptions(options)

  const state: VibeverseState = {
    scene,
    camera,
    player,
    warpConfig: computedOptions.warpConfig,
    options: computedOptions,
    startPortal: null,
    exitPortal: null,
    startPortalBox: null,
    exitPortalBox: null,
    enableWarpEffect: computedOptions.warpConfig !== null,
    warpEffect: null,
    isWarping: false,
    cameraDirection: new THREE.Vector3(),
    currentCameraSpeed: 0,
  }

  // Initialize navigation
  const createHUDPortals = createNavigation({
    portalUrl: computedOptions.username
      ? `https://portal.pieter.com?username=${computedOptions.username}`
      : 'https://portal.pieter.com',
  })

  // Creates both start and exit portals
  const createInGamePortals = (): {
    exitPortal: THREE.Group
    startPortal: THREE.Group | null
  } => {
    // Create exit portal with default settings
    const exitPortal = createExitPortal(state, computedOptions.exit)

    if (isVibeverse()) {
      // Create entrance portal with computed position
      const entrancePortal = createStartPortal(state, computedOptions.enter)
    }

    return {
      exitPortal,
      startPortal: state.startPortal,
    }
  }

  // Updates portal state
  const update = (): void => {
    checkPortalCollisions(state)
  }

  // Load avatar if specified in URL
  const avatarUrlOrUsername = getAvatarFromUrl()
  if (avatarUrlOrUsername) {
    loadAndSwapAvatar(state, avatarUrlOrUsername)
  }

  return {
    createInGamePortals,
    update,
    createHUDPortals,
  }
}
