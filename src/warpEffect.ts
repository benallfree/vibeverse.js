import * as THREE from 'three'
import type { VibeverseState, WarpConfig } from './types'

// Default configuration for the warp effect
export const DEFAULT_WARP_CONFIG: WarpConfig = {
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

// Creates the warp effect geometry and materials
export const createWarpEffect = (state: VibeverseState): THREE.LineSegments => {
  const config = state.warpConfig!
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(config.lineCount * config.pointsPerLine * 3)
  const velocities = new Float32Array(config.lineCount * 3)
  const colors = new Float32Array(config.lineCount * config.pointsPerLine * 3)
  const timingOffsets = new Float32Array(config.lineCount)

  const matrix = new THREE.Matrix4()
  const basePosition = new THREE.Vector3()
  const transformedPosition = new THREE.Vector3()

  for (let i = 0; i < config.lineCount; i++) {
    const theta = (i / config.lineCount) * Math.PI * 2

    for (let j = 0; j < config.pointsPerLine; j++) {
      const idx = (i * config.pointsPerLine + j) * 3
      const z = j * config.lineLength
      const radius = config.tunnelRadius + j * config.tunnelExpansion

      positions[idx] = Math.cos(theta) * radius
      positions[idx + 1] = Math.sin(theta) * radius
      positions[idx + 2] = z

      const intensity = 1 - (j / (config.pointsPerLine - 1)) * 0.9
      colors[idx] = intensity
      colors[idx + 1] = intensity
      colors[idx + 2] = 1
    }

    const lineIdx = i * 3
    velocities[lineIdx] = 0
    velocities[lineIdx + 1] = 0
    velocities[lineIdx + 2] = config.minSpeed + Math.random() * config.speedVariation

    timingOffsets[i] = Math.random() * Math.PI * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
    linewidth: 1.5,
  })

  const lines = new THREE.LineSegments(geometry, material)
  lines.userData.velocities = velocities
  lines.userData.timingOffsets = timingOffsets
  lines.userData.basePosition = basePosition
  lines.userData.transformedPosition = transformedPosition
  lines.userData.matrix = matrix
  lines.userData.startTime = Date.now()
  lines.visible = false

  lines.position.copy(state.camera.position)
  state.scene.add(lines)

  return lines
}

// Starts the warp effect animation
export const startWarpEffect = (state: VibeverseState): void => {
  if (!state.enableWarpEffect || state.isWarping) return

  state.isWarping = true
  state.currentCameraSpeed = 0

  if (!state.warpEffect) {
    state.warpEffect = createWarpEffect(state)
  }

  state.warpEffect.visible = true
  ;(state.warpEffect.material as THREE.LineBasicMaterial).opacity = 1.0

  const animate = (): void => {
    if (!state.isWarping) return

    const config = state.warpConfig!
    const positions = state.warpEffect!.geometry.attributes.position.array
    const velocities = state.warpEffect!.userData.velocities
    const timingOffsets = state.warpEffect!.userData.timingOffsets
    const basePosition = state.warpEffect!.userData.basePosition
    const transformedPosition = state.warpEffect!.userData.transformedPosition
    const matrix = state.warpEffect!.userData.matrix
    const currentTime = Date.now()
    const elapsedTime = (currentTime - state.warpEffect!.userData.startTime) / 1000

    // Update camera position
    // Get camera's current forward direction
    state.camera.getWorldDirection(state.cameraDirection)

    // Accelerate camera movement
    state.currentCameraSpeed = Math.min(config.cameraSpeed, state.currentCameraSpeed + config.cameraAcceleration)

    // Move camera forward in its current direction
    state.camera.position.addScaledVector(state.cameraDirection, state.currentCameraSpeed)

    // Update warp effect position to follow camera
    state.warpEffect!.position.copy(state.camera.position)
    matrix.copy(state.camera.matrix)

    for (let i = 0; i < velocities.length / 3; i++) {
      const baseVelocity = velocities[i * 3 + 2]
      const theta = (i / (velocities.length / 3)) * Math.PI * 2

      const timingOffset = timingOffsets[i]
      const movementFactor = (Math.sin(elapsedTime * config.oscillationSpeed + timingOffset) + 1) * 0.5
      const currentVelocity = baseVelocity * (config.minSpeedFactor + movementFactor * (1 - config.minSpeedFactor))

      for (let j = 0; j < config.pointsPerLine; j++) {
        const posIdx = (i * config.pointsPerLine + j) * 3

        basePosition.set(positions[posIdx], positions[posIdx + 1], positions[posIdx + 2])

        positions[posIdx + 2] += currentVelocity

        if (positions[posIdx + 2] > config.resetDistance) {
          for (let k = 0; k < config.pointsPerLine; k++) {
            const resetIdx = (i * config.pointsPerLine + k) * 3
            const z = k * config.lineLength - config.resetOffset
            const radius = config.tunnelRadius + k * config.tunnelExpansion

            positions[resetIdx] = Math.cos(theta) * radius
            positions[resetIdx + 1] = Math.sin(theta) * radius
            positions[resetIdx + 2] = z
          }
        }
      }
    }

    state.warpEffect!.quaternion.copy(state.camera.quaternion)
    state.warpEffect!.geometry.attributes.position.needsUpdate = true
    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}

// Stops the warp effect animation
export const stopWarpEffect = (state: VibeverseState): void => {
  if (!state.warpEffect || !state.isWarping) return

  state.warpEffect.visible = false
  state.isWarping = false
  state.currentCameraSpeed = 0
}
