import * as THREE from 'three'
import type { PortalOptions, VibeverseState } from './types'
import { startWarpEffect } from './warpEffect'

// Creates a portal mesh with specified properties
export const createPortalMesh = (options: PortalOptions, color: number = 0xff0000): THREE.Group => {
  const portal = new THREE.Group()

  // Create the torus ring
  const tubeRadius = options.radius * 0.1
  const ringGeometry = new THREE.TorusGeometry(options.radius, tubeRadius, 16, 100)
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    transparent: true,
    opacity: 0.8,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial) as unknown as THREE.Object3D
  portal.add(ring)

  // Create portal inner surface
  const innerRadius = options.radius * 0.9
  const innerGeometry = new THREE.CircleGeometry(innerRadius, 32)
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })
  const inner = new THREE.Mesh(innerGeometry, innerMaterial) as unknown as THREE.Object3D
  portal.add(inner)

  // Create particle system for portal effect
  const particleCount = 500
  const particlesGeometry = new THREE.BufferGeometry()
  const particlePositions = new Float32Array(particleCount * 3)
  const particleColors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount * 3; i += 3) {
    const angle = Math.random() * Math.PI * 2
    const particleRadius = options.radius + (Math.random() - 0.5) * (options.radius * 0.15)

    particlePositions[i] = Math.cos(angle) * particleRadius
    particlePositions[i + 1] = Math.sin(angle) * particleRadius
    particlePositions[i + 2] = (Math.random() - 0.5) * (options.radius * 0.15)

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
    size: options.radius * 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  })

  const particles = new THREE.Points(particlesGeometry, particleMaterial) as unknown as THREE.Object3D
  portal.add(particles)

  portal.userData = {
    particlesGeometry: particlesGeometry,
    type: color === 0xff0000 ? 'entrance' : 'exit',
  }

  const wrapper = new THREE.Group() as unknown as THREE.Group
  wrapper.add(portal)
  const bbox = new THREE.Box3().setFromObject(portal)
  portal.position.y = -bbox.min.y

  // Position the wrapper
  wrapper.position.copy(options.position)

  // Apply rotation
  wrapper.rotation.copy(options.lookAt)

  wrapper.userData = {
    portal: portal,
    particlesGeometry: portal.userData.particlesGeometry,
    type: portal.userData.type,
  }

  if (options.label) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return wrapper

    canvas.width = 512
    canvas.height = 64

    context.fillStyle = options.color
    context.font = 'bold 32px Arial'
    context.textAlign = 'center'
    context.fillText(options.label, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const labelGeometry = new THREE.PlaneGeometry(options.radius * 1.6, options.radius * 0.25)
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    })

    const label = new THREE.Mesh(labelGeometry, labelMaterial) as unknown as THREE.Object3D
    label.position.y = options.radius * 1.5
    portal.add(label)
  }

  return wrapper
}

// Creates a start portal that returns users to their previous location
export const createStartPortal = (state: VibeverseState, options: PortalOptions): THREE.Group => {
  const portal = createPortalMesh(options, 0xff0000)

  state.scene.add(portal)
  state.startPortalBox = new THREE.Box3().setFromObject(portal)
  state.startPortal = portal

  animateStartPortal(state)
  return portal
}

// Creates an exit portal that takes users to Vibeverse
export const createExitPortal = (state: VibeverseState, options: PortalOptions): THREE.Group => {
  const portal = createPortalMesh(options, 0x00ff00)

  state.scene.add(portal)
  state.exitPortalBox = new THREE.Box3().setFromObject(portal)
  state.exitPortal = portal

  animateExitPortal(state)
  return portal
}

// Animates the start portal particles
const animateStartPortal = (state: VibeverseState): void => {
  if (!state.startPortal || !state.startPortal.userData) return

  const particlesGeometry = state.startPortal.userData.particlesGeometry
  if (!particlesGeometry) return

  const positions = particlesGeometry.attributes.position.array

  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] = Math.sin(Date.now() * 0.002 + i) * 0.3
  }

  particlesGeometry.attributes.position.needsUpdate = true
  requestAnimationFrame(() => animateStartPortal(state))
}

// Animates the exit portal particles
const animateExitPortal = (state: VibeverseState): void => {
  if (!state.exitPortal || !state.exitPortal.userData) return

  const particlesGeometry = state.exitPortal.userData.particlesGeometry
  if (!particlesGeometry) return

  const positions = particlesGeometry.attributes.position.array

  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] = Math.sin(Date.now() * 0.002 + i) * 0.3
  }

  particlesGeometry.attributes.position.needsUpdate = true
  requestAnimationFrame(() => animateExitPortal(state))
}

// Checks for player collisions with portals
export const checkPortalCollisions = (state: VibeverseState, player: { position: THREE.Vector3 }): void => {
  if (!player) return

  const playerPosition = new THREE.Vector3(player.position.x, player.position.y, player.position.z)

  if (state.startPortalBox && state.startPortal) {
    state.startPortalBox.setFromObject(state.startPortal)
    const expandedStartBox = state.startPortalBox.clone().expandByScalar(1.5)
    if (expandedStartBox.containsPoint(playerPosition)) {
      handleStartPortalEntry(state)
    }
  }

  if (state.exitPortalBox && state.exitPortal) {
    state.exitPortalBox.setFromObject(state.exitPortal)
    const expandedExitBox = state.exitPortalBox.clone().expandByScalar(1.5)
    if (expandedExitBox.containsPoint(playerPosition)) {
      handleExitPortalEntry(state)
    }
  }
}

// Handles player entry into start portal
const handleStartPortalEntry = (state: VibeverseState): void => {
  const url = refUrl()
  if (url) {
    if (state.enableWarpEffect) {
      startWarpEffect(state)
    }
    const currentParams = new URLSearchParams(window.location.search)
    const newParams = new URLSearchParams()
    Array.from(currentParams.entries()).forEach(([key, value]) => {
      if (key !== 'ref') {
        newParams.append(key, value)
      }
    })
    const paramString = newParams.toString()
    window.location.href = url + (paramString ? '?' + paramString : '')
  }
}

// Handles player entry into exit portal
const handleExitPortalEntry = (state: VibeverseState): void => {
  const currentParams = new URLSearchParams(window.location.search)
  const newParams = new URLSearchParams()
  newParams.append('portal', 'true')

  if (state.options.username) {
    newParams.append('username', state.options.username)
  }

  newParams.append('color', 'white')

  Array.from(currentParams.entries()).forEach(([key, value]) => {
    if (!newParams.has(key)) {
      newParams.append(key, value)
    }
  })

  const paramString = newParams.toString()
  const nextPage = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '')

  if (!document.getElementById('preloadFrame')) {
    const iframe = document.createElement('iframe')
    iframe.id = 'preloadFrame'
    iframe.style.display = 'none'
    iframe.src = nextPage
    document.body.appendChild(iframe)
  }

  if (state.enableWarpEffect) {
    startWarpEffect(state)
  }
  window.location.href = nextPage
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
