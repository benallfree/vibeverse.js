/**
 * Vibeverse
 * -----------------------
 * The Vibeverse (x.com/hashtag/vibeverse)is an interconnected network of 3D web games with portals to and from each game.
 * You can even bring your custom player avatar along with you.
 *
 * Credit to @levelsio for the original implementation of this portal system.
 * -----------------------
 * Integration guide for connecting your experience to the Vibeverse metaverse.
 *
 * Quick Start:
 * 1. Import and initialize Vibeverse with your Three.js scene, camera and socket
 * 2. Call createPortals() to add portal meshes to your scene
 *
 * Portal Behavior:
 * - Exit Portal (green): Takes users to Vibeverse
 * - Start Portal (red): Only appears when 'ref' URL param is present
 * - The Start Portal returns users to the referring experience
 *
 * URL Parameters:
 * - ref: The referring URL to return to (e.g. ?ref=yourgame.com)
 * - portal: Set to 'true' when coming from another experience
 * - username: Player identifier passed between experiences
 * - color: Avatar color preference
 *
 * Warp Effect:
 * The portal system includes a configurable warp effect when transitioning between portals.
 * You can:
 * - Disable it by passing null as warpConfig in the constructor
 * - Customize it by passing your own warp configuration
 * - Use default settings by not specifying warpConfig
 *
 * Splash Page Bypass:
 * If your experience has a splash/loading page, you can check if the user is coming
 * from Vibeverse by using the isVibeverse() helper:
 *
 * ```js
 * if (isVibeverse()) {
 *   // Skip splash and load directly into experience
 * }
 * ```
 *
 * Audio Handling:
 * When bypassing the splash screen, you should keep audio muted initially and only
 * start it after the first user interaction to comply with browser autoplay policies.
 * Here's an example of how to handle this:
 *
 * ```js
 * // Setup one-time interaction handler
 * const enableAudioOnInteraction = (event) => {
 *   // Remove listeners since we only need this once
 *   document.removeEventListener('click', enableAudioOnInteraction)
 *   document.removeEventListener('touchstart', enableAudioOnInteraction)
 *
 *   // Start your audio here
 *   // yourAudioSystem.start()
 * }
 *
 * // Add listeners for both mouse and touch events
 * document.addEventListener('click', enableAudioOnInteraction)
 * document.addEventListener('touchstart', enableAudioOnInteraction)
 * ```
 *
 */

/**
 * Helper to check if user is coming from Vibeverse
 * @returns {boolean} True if user is coming from Vibeverse portal
 */
export function isVibeverse() {
  return !!refUrl()
}

/**
 * Gets the referring URL from URL parameters
 * @returns {string|null} The referring URL with https:// prefix, or null if not present
 * @private
 */
const refUrl = () => {
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

import * as THREE from 'three'

/**
 * Default configuration for the warp effect
 * @typedef {Object} WarpConfig
 * @property {number} lineCount - Number of lines in the tunnel
 * @property {number} pointsPerLine - Points making up each line
 * @property {number} tunnelRadius - Initial radius of the tunnel
 * @property {number} tunnelExpansion - How much the tunnel expands per point
 * @property {number} minSpeed - Minimum base speed
 * @property {number} speedVariation - Random variation in speed
 * @property {number} oscillationSpeed - Speed of the sine wave oscillation
 * @property {number} minSpeedFactor - Minimum speed factor during oscillation
 * @property {number} lineLength - Length between points in a line
 * @property {number} resetDistance - Distance at which lines reset
 * @property {number} resetOffset - How far back lines reset to
 * @property {number} cameraSpeed - Speed at which camera moves forward
 * @property {number} cameraAcceleration - How quickly camera speeds up
 */
export const DEFAULT_WARP_CONFIG = {
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

/**
 * @typedef {Object} VibeverseOptions
 * @property {string} [labelText] - Custom text to display above the portal
 * @property {string} [labelColor] - Color of the portal label text
 * @property {THREE.Euler} [lookAt] - Rotation to apply to the portal
 * @property {Object} [position] - Position coordinates for the portal
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 * @property {number} position.z - Z coordinate
 */

/**
 * Vibeverse class for managing interconnected 3D web game portals
 */
export class Vibeverse {
  /**
   * Creates a new Vibeverse instance
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Camera} camera - Three.js camera
   * @param {WebSocket} socket - WebSocket connection
   * @param {WarpConfig|null} [warpConfig=DEFAULT_WARP_CONFIG] - Configuration for warp effect
   */
  constructor(scene, camera, socket, warpConfig = DEFAULT_WARP_CONFIG) {
    this.scene = scene
    this.camera = camera
    this.socket = socket
    this.startPortal = null
    this.exitPortal = null
    this.startPortalBox = null
    this.exitPortalBox = null
    this.playerCheckInterval = null
    this.enableWarpEffect = warpConfig !== null // Enable warp effect if config is provided
    this.warpEffect = null
    this.isWarping = false

    // Warp effect configuration - use provided config or defaults
    this.warpConfig = warpConfig || DEFAULT_WARP_CONFIG

    // Create a vector to store camera's forward direction
    this.cameraDirection = new THREE.Vector3()
    this.currentCameraSpeed = 0
  }

  /**
   * Creates a portal mesh with specified properties
   * @param {number} [radius=6] - Radius of the portal
   * @param {number} [color=0xff0000] - Color of the portal (hex)
   * @param {VibeverseOptions} [options={}] - Additional portal options
   * @returns {THREE.Group} Portal mesh group
   * @private
   */
  createPortalMesh(radius = 6, color = 0xff0000, options = {}) {
    const portal = new THREE.Group()

    // Create the torus ring
    const tubeRadius = radius * 0.1
    const ringGeometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100)
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      transparent: true,
      opacity: 0.8,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    portal.add(ring)

    // Create portal inner surface
    const innerRadius = radius * 0.9
    const innerGeometry = new THREE.CircleGeometry(innerRadius, 32)
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    const inner = new THREE.Mesh(innerGeometry, innerMaterial)
    portal.add(inner)

    // Create particle system for portal effect
    const particleCount = 500
    const particlesGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2
      const particleRadius = radius + (Math.random() - 0.5) * (radius * 0.15)

      particlePositions[i] = Math.cos(angle) * particleRadius
      particlePositions[i + 1] = Math.sin(angle) * particleRadius
      particlePositions[i + 2] = (Math.random() - 0.5) * (radius * 0.15)

      if (color === 0xff0000) {
        particleColors[i] = 0.8 + Math.random() * 0.2
        particleColors[i + 1] = 0
        particleColors[i + 2] = 0
      } else {
        particleColors[i] = 0
        particleColors[i + 1] = 0.8 + Math.random() * 0.2
        particleColors[i + 2] = 0
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: radius * 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    })

    const particles = new THREE.Points(particlesGeometry, particleMaterial)
    portal.add(particles)

    portal.userData = {
      particlesGeometry: particlesGeometry,
      type: color === 0xff0000 ? 'entrance' : 'exit',
    }

    const defaultLabelText = portal.userData.type === 'entrance' ? 'Go back' : 'To Vibeverse'
    const labelText = options.labelText || defaultLabelText
    const wrapper = new THREE.Group()

    if (labelText) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return wrapper

      canvas.width = 512
      canvas.height = 64

      const labelColor = options.labelColor || (color === 0xff0000 ? '#ff0000' : '#00ff00')

      context.fillStyle = labelColor
      context.font = 'bold 32px Arial'
      context.textAlign = 'center'
      context.fillText(labelText, canvas.width / 2, canvas.height / 2)

      const texture = new THREE.CanvasTexture(canvas)
      const labelGeometry = new THREE.PlaneGeometry(radius * 1.6, radius * 0.25)
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      })

      const label = new THREE.Mesh(labelGeometry, labelMaterial)
      label.position.y = radius * 1.5
      portal.add(label)
    }

    wrapper.add(portal)
    const bbox = new THREE.Box3().setFromObject(portal)
    portal.position.y = -bbox.min.y

    // Position the wrapper
    const position = options.position || { x: 0, y: 0, z: 0 }
    wrapper.position.set(position.x, position.y, position.z)

    // Apply rotation after positioning
    if (options.lookAt) {
      wrapper.rotation.setFromEuler(options.lookAt)
    } else {
      const targetVector = new THREE.Vector3(0, 0, 0)
      const direction = targetVector.sub(wrapper.position).normalize()
      const matrix = new THREE.Matrix4()
      matrix.lookAt(wrapper.position, targetVector, new THREE.Vector3(0, 1, 0))
      wrapper.quaternion.setFromRotationMatrix(matrix)

      // Rotate 180 degrees around Y axis to face the correct direction
      wrapper.rotateY(Math.PI)
    }

    wrapper.userData = {
      portal: portal,
      particlesGeometry: portal.userData.particlesGeometry,
      type: portal.userData.type,
    }

    return wrapper
  }

  /**
   * Creates a start portal that returns users to their previous location
   * @param {number} [x=0] - X coordinate
   * @param {number} [y=0] - Y coordinate
   * @param {number} [z=0] - Z coordinate
   * @param {number} [radius=6] - Portal radius
   * @param {VibeverseOptions} [options={}] - Additional portal options
   * @returns {THREE.Group} Start portal mesh group
   */
  createStartPortal(x = 0, y = 0, z = 0, radius = 6, options = {}) {
    const portal = this.createPortalMesh(radius, 0xff0000, {
      labelText: options.labelText || 'Go back',
      labelColor: options.labelColor || '#ff0000',
      lookAt: options.lookAt,
      position: { x, y, z },
    })

    this.scene.add(portal)
    this.startPortalBox = new THREE.Box3().setFromObject(portal)
    this.startPortal = portal

    this.animateStartPortal()
    return portal
  }

  /**
   * Creates an exit portal that takes users to Vibeverse
   * @param {number} [x=0] - X coordinate
   * @param {number} [y=0] - Y coordinate
   * @param {number} [z=0] - Z coordinate
   * @param {number} [radius=6] - Portal radius
   * @param {VibeverseOptions} [options={}] - Additional portal options
   * @returns {THREE.Group} Exit portal mesh group
   */
  createExitPortal(x = 0, y = 0, z = 0, radius = 6, options = {}) {
    const portal = this.createPortalMesh(radius, 0x00ff00, {
      labelText: options.labelText || 'To Vibeverse',
      labelColor: options.labelColor || '#00ff00',
      lookAt: options.lookAt,
      position: { x, y, z },
    })

    this.scene.add(portal)
    this.exitPortalBox = new THREE.Box3().setFromObject(portal)
    this.exitPortal = portal

    this.animateExitPortal()
    return portal
  }

  /**
   * Animates the start portal particles
   * @private
   */
  animateStartPortal() {
    if (!this.startPortal || !this.startPortal.userData) return

    const particlesGeometry = this.startPortal.userData.particlesGeometry
    if (!particlesGeometry) return

    const positions = particlesGeometry.attributes.position.array

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] = Math.sin(Date.now() * 0.002 + i) * 0.3
    }

    particlesGeometry.attributes.position.needsUpdate = true
    requestAnimationFrame(this.animateStartPortal.bind(this))
  }

  /**
   * Animates the exit portal particles
   * @private
   */
  animateExitPortal() {
    if (!this.exitPortal || !this.exitPortal.userData) return

    const particlesGeometry = this.exitPortal.userData.particlesGeometry
    if (!particlesGeometry) return

    const positions = particlesGeometry.attributes.position.array

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] = Math.sin(Date.now() * 0.002 + i) * 0.3
    }

    particlesGeometry.attributes.position.needsUpdate = true
    requestAnimationFrame(this.animateExitPortal.bind(this))
  }

  /**
   * Checks for player collisions with portals
   * @param {Object} player - Player object with position property
   */
  checkPortalCollisions(player) {
    if (!player) return

    const playerPosition = new THREE.Vector3(player.position.x, player.position.y, player.position.z)

    if (this.startPortalBox && this.startPortal) {
      this.startPortalBox.setFromObject(this.startPortal)
      const expandedStartBox = this.startPortalBox.clone().expandByScalar(1.5)
      if (expandedStartBox.containsPoint(playerPosition)) {
        this.handleStartPortalEntry()
      }
    }

    if (this.exitPortalBox && this.exitPortal) {
      this.exitPortalBox.setFromObject(this.exitPortal)
      const expandedExitBox = this.exitPortalBox.clone().expandByScalar(1.5)
      if (expandedExitBox.containsPoint(playerPosition)) {
        this.handleExitPortalEntry()
      }
    }
  }

  /**
   * Creates the warp effect geometry and materials
   * @returns {THREE.LineSegments} Warp effect mesh
   * @private
   */
  createWarpEffect() {
    const config = this.warpConfig
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
      velocities[lineIdx + 2] = config.minSpeed + Math.random() * config.speedVariation // Now positive for opposite direction

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

    lines.position.copy(this.camera.position)
    this.scene.add(lines)

    return lines
  }

  /**
   * Starts the warp effect animation
   */
  startWarpEffect() {
    if (!this.enableWarpEffect || this.isWarping) return

    this.isWarping = true
    this.currentCameraSpeed = 0

    if (!this.warpEffect) {
      this.warpEffect = this.createWarpEffect()
    }

    this.warpEffect.visible = true
    this.warpEffect.material.opacity = 1

    const animate = () => {
      if (!this.isWarping) return

      const config = this.warpConfig
      const positions = this.warpEffect.geometry.attributes.position.array
      const velocities = this.warpEffect.userData.velocities
      const timingOffsets = this.warpEffect.userData.timingOffsets
      const basePosition = this.warpEffect.userData.basePosition
      const transformedPosition = this.warpEffect.userData.transformedPosition
      const matrix = this.warpEffect.userData.matrix
      const currentTime = Date.now()
      const elapsedTime = (currentTime - this.warpEffect.userData.startTime) / 1000

      // Update camera position
      // Get camera's current forward direction
      this.camera.getWorldDirection(this.cameraDirection)

      // Accelerate camera movement
      this.currentCameraSpeed = Math.min(config.cameraSpeed, this.currentCameraSpeed + config.cameraAcceleration)

      // Move camera forward in its current direction
      this.camera.position.addScaledVector(this.cameraDirection, this.currentCameraSpeed)

      // Update warp effect position to follow camera
      this.warpEffect.position.copy(this.camera.position)
      matrix.copy(this.camera.matrix)

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

      this.warpEffect.quaternion.copy(this.camera.quaternion)
      this.warpEffect.geometry.attributes.position.needsUpdate = true
      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  /**
   * Stops the warp effect animation
   */
  stopWarpEffect() {
    if (!this.warpEffect || !this.isWarping) return

    this.warpEffect.visible = false
    this.isWarping = false
    this.currentCameraSpeed = 0
  }

  /**
   * Handles player entry into start portal
   * @private
   */
  handleStartPortalEntry() {
    const url = refUrl()
    if (url) {
      if (this.enableWarpEffect) {
        this.startWarpEffect()
      }
      const currentParams = new URLSearchParams(window.location.search)
      const newParams = new URLSearchParams()
      for (const [key, value] of currentParams) {
        if (key !== 'ref') {
          newParams.append(key, value)
        }
      }
      const paramString = newParams.toString()
      window.location.href = url + (paramString ? '?' + paramString : '')
    }
  }

  /**
   * Handles player entry into exit portal
   * @private
   */
  handleExitPortalEntry() {
    const currentParams = new URLSearchParams(window.location.search)
    const newParams = new URLSearchParams()
    newParams.append('portal', 'true')

    if (this.socket && this.socket.id) {
      const player = this.socket.id
      newParams.append('username', player)
    }

    newParams.append('color', 'white')

    for (const [key, value] of currentParams) {
      if (!newParams.has(key)) {
        newParams.append(key, value)
      }
    }

    const paramString = newParams.toString()
    const nextPage = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '')

    if (!document.getElementById('preloadFrame')) {
      const iframe = document.createElement('iframe')
      iframe.id = 'preloadFrame'
      iframe.style.display = 'none'
      iframe.src = nextPage
      document.body.appendChild(iframe)
    }

    if (this.enableWarpEffect) {
      this.startWarpEffect()
    }
    window.location.href = nextPage
  }

  /**
   * Creates both start and exit portals
   * @param {number} [x=45] - X coordinate
   * @param {number} [y=0] - Y coordinate
   * @param {number} [z=45] - Z coordinate
   * @param {number} [radius=6] - Portal radius
   * @param {VibeverseOptions} [options={}] - Additional portal options
   * @returns {Object} Object containing both portal references
   * @property {THREE.Group} exitPortal - The exit portal mesh
   * @property {THREE.Group|null} startPortal - The start portal mesh (null if not created)
   */
  createPortals(x = 45, y = 0, z = 45, radius = 6, options = {}) {
    // Create exit portal with default settings
    const exitPortal = this.createExitPortal(x, y, z, radius, {
      labelText: 'To Vibeverse',
      labelColor: '#00ff00',
      lookAt: options.lookAt,
    })

    if (isVibeverse()) {
      // Create entrance portal slightly offset from exit portal
      const entrancePortal = this.createStartPortal(x - radius * 2.5, y, z, radius, {
        labelText: 'Go back',
        labelColor: '#ff0000',
        lookAt: options.lookAt,
      })
    }

    return {
      exitPortal,
      startPortal: this.startPortal,
    }
  }

  /**
   * Updates portal state
   */
  update() {
    // No need to update collision boxes every frame, we update them in checkPortalCollisions
  }

  /**
   * Toggles the warp effect on/off
   * @param {boolean} enable - Whether to enable the warp effect
   */
  toggleWarpEffect(enable) {
    this.enableWarpEffect = enable
  }
}
