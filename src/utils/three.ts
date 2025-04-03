import * as THREE from 'three'

// Helper to scale an object to fit within a bounding box
export function scaleToFitBoundingBox(object: THREE.Object3D, targetBox: THREE.Box3): void {
  const box = new THREE.Box3().setFromObject(object)
  const scale = new THREE.Vector3()

  scale.x = targetBox.max.x - targetBox.min.x
  scale.y = targetBox.max.y - targetBox.min.y
  scale.z = targetBox.max.z - targetBox.min.z

  const objectSize = new THREE.Vector3()
  objectSize.x = box.max.x - box.min.x
  objectSize.y = box.max.y - box.min.y
  objectSize.z = box.max.z - box.min.z

  const scaleFactor = Math.min(scale.x / objectSize.x, scale.y / objectSize.y, scale.z / objectSize.z)

  object.scale.multiplyScalar(scaleFactor)
}

// Helper to center or bottom-align an object
export function alignObject(object: THREE.Object3D, useBottomOrigin: boolean): void {
  const box = new THREE.Box3().setFromObject(object)
  const center = new THREE.Vector3()
  box.getCenter(center)

  if (useBottomOrigin) {
    // Move object so its bottom is at origin
    object.position.y = -box.min.y
  } else {
    // Center object at origin
    object.position.sub(center)
  }
}
