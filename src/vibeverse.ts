import * as THREE from 'three'
import { PartialDeep } from 'type-fest'
import { computeVibeverseOptions } from './config'
import { createNavigation } from './navigation'
import { checkPortalCollisions, createExitPortal, createStartPortal } from './portal'
import type { VibeverseInstance, VibeverseOptions, VibeverseState } from './types'
import { stopWarpEffect } from './warpEffect'

// Helper to check if user is coming from Vibeverse
export function isVibeverse(): boolean {
  return !!refUrl()
}

// Gets the referring URL from URL parameters
const refUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search)
  const refUrl = params.get('ref')
  if (refUrl) {
    let url = refUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    return url
  }
  return null
}

// Creates a new Vibeverse instance
export function vibeverse(
  scene: THREE.Scene,
  camera: THREE.Camera,
  player: THREE.Object3D,
  options?: PartialDeep<VibeverseOptions>
): VibeverseInstance {
  const computedOptions = computeVibeverseOptions(options)

  const state: VibeverseState = {
    scene,
    camera,
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
  const navigation = createNavigation({
    portalUrl: computedOptions.username
      ? `https://portal.pieter.com?username=${computedOptions.username}`
      : 'https://portal.pieter.com',
  })

  // Creates both start and exit portals
  const createPortals = (): {
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
    // No need to update collision boxes every frame, we update them in checkPortalCollisions
  }

  // Toggles the warp effect on/off
  const toggleWarpEffect = (enable: boolean): void => {
    state.enableWarpEffect = enable
    if (!enable) {
      stopWarpEffect(state)
    }
  }

  return {
    createPortals,
    checkPortalCollisions: (player) => checkPortalCollisions(state, player),
    update,
    toggleWarpEffect,
    navigation,
  }
}
