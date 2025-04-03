import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { VibeverseState } from './types'
import { alignObject, scaleToFitBoundingBox } from './utils/three'
import { isAllowedDomain, isUrl, usernameToVibatarUrl } from './utils/url'

// Main function to load and swap avatar
export async function loadAndSwapAvatar(state: VibeverseState, avatarUrlOrUsername: string): Promise<void> {
  const { allowedDomains, useBottomOrigin } = state.options.avatarConfig

  // Convert username to URL if needed
  const avatarUrl = isUrl(avatarUrlOrUsername) ? avatarUrlOrUsername : usernameToVibatarUrl(avatarUrlOrUsername)

  // Check if URL is allowed
  if (!isAllowedDomain(avatarUrl, allowedDomains)) {
    console.warn(`Avatar URL ${avatarUrl} is not from an allowed domain`)
    return
  }

  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(avatarUrl)

    // Get the first mesh from the loaded model
    const newAvatar = gltf.scene.children[0]
    if (!newAvatar) {
      console.warn('No mesh found in loaded avatar')
      return
    }

    // Store original player's bounding box
    const originalBox = new THREE.Box3().setFromObject(state.player)

    // Scale new avatar to fit original player's size
    scaleToFitBoundingBox(newAvatar, originalBox)

    // Align the avatar
    alignObject(newAvatar, useBottomOrigin)

    // Hide all children of original player
    state.player.traverse((child) => {
      if (child instanceof THREE.Object3D) {
        child.visible = false
      }
    })

    // Add new avatar as child of player
    state.player.add(newAvatar)
  } catch (error) {
    console.error('Failed to load avatar:', error)
  }
}
