import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { VibeverseState } from './types'
import { alignObject, scaleToFitBoundingBox } from './utils/three'
import { isAllowedDomain, isUrl, usernameToVibatarUrl } from './utils/url'

// Queue system for avatar loading
let inFlightCount = 0
const queue: Array<() => Promise<void>> = []

// Process the next item in the queue if we have capacity
const processQueue = (state: VibeverseState) => {
  while (inFlightCount < state.options.avatarConfig.maxConcurrent && queue.length > 0) {
    const next = queue.shift()
    if (next) {
      inFlightCount++
      next().finally(() => {
        inFlightCount--
        processQueue(state)
      })
    }
  }
}

// Main function to load and swap avatar
export async function loadAndSwapAvatar(
  state: VibeverseState,
  targetPlayer: THREE.Object3D,
  avatarUrlOrUsername: string
): Promise<void> {
  const { allowedDomains, useBottomOrigin } = state.options.avatarConfig

  // Convert username to URL if needed
  const avatarUrl = isUrl(avatarUrlOrUsername) ? avatarUrlOrUsername : usernameToVibatarUrl(avatarUrlOrUsername)

  // Check if URL is allowed
  if (!isAllowedDomain(avatarUrl, allowedDomains)) {
    console.warn(`Avatar URL ${avatarUrl} is not from an allowed domain. Allowed domains: ${allowedDomains.join(', ')}`)
    return
  }

  // Create the actual loading function
  const loadAvatar = async () => {
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
      const originalBox = new THREE.Box3().setFromObject(targetPlayer)

      // Scale new avatar to fit original player's size
      scaleToFitBoundingBox(newAvatar, originalBox)

      // Align the avatar
      alignObject(newAvatar, useBottomOrigin)

      // Hide all children of original player
      targetPlayer.traverse((child) => {
        if (child instanceof THREE.Object3D) {
          child.visible = false
        }
      })

      // Add new avatar as child of player
      targetPlayer.add(newAvatar)

      // Trigger events
      const event = { player: targetPlayer, avatarUrlOrUsername }

      // Only trigger local event if this is the local player
      if (targetPlayer === state.player) {
        state.onLocalAvatarChanged[1](event)
      } else {
        state.onRemoteAvatarChanged[1](event)
      }
    } catch (error) {
      console.error('Failed to load avatar:', error)
    }
  }

  // Add to queue and process
  queue.push(loadAvatar)
  processQueue(state)
}
